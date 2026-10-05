import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

type PayoutRecord = {
  id?: string
  type?: string
  status?: string
  reference?: string
  event_type?: string
  execution_url?: string
  error?: { code?: string; message?: string } | string
  details?: { message?: string; return_code?: string | number; transaction?: { status?: string } }
  message?: string
  detail?: string
}

export type PayoutRequest = {
  email: string
  phone: string
  name: string
  amount: number
  description: string
  reference: string
  channel: 'mobile' | 'bank'
  bankName?: string
  bankCode?: string
  bankAccountName?: string
  bankAccountNumber?: string
}

export function payoutLedgerStatus(status?: string, eventType?: string) {
  const value = (status || '').toLowerCase()
  if (value === 'success' || value === 'paid' || value === 'successful') return 'paid' as const
  if (value === 'error' || value === 'failed' || value === 'cancelled' || value === 'canceled' || value === 'expired') return 'failed' as const
  if (eventType === 'payout.success') return 'paid' as const
  if (eventType === 'payout.failed' || eventType === 'payout.error') return 'failed' as const
  return 'pending' as const
}

export async function sendPaytotaPayout(input: PayoutRequest) {
  const base = paytotaBase()
  const secret = process.env.PAYTOTA_SECRET_KEY
  const brandId = process.env.PAYTOTA_BRAND_ID
  if (!base || !secret || !brandId) return { error: 'Payments are not ready.', status: 'failed' as const }

  const client: Record<string, string> = {
    email: input.email,
    phone: input.phone,
    country: 'UG',
    full_name: input.name,
  }
  if (input.channel === 'bank' && input.bankAccountNumber) client.bank_account = input.bankAccountNumber

  let created: Response
  try {
    created = await fetch(`${base}/api/v1/payouts/`, {
      method: 'POST',
      headers: paytotaHeaders(secret),
      body: JSON.stringify({
        client,
        payment: {
          currency: 'UGX',
          amount: String(input.amount),
          description: input.description,
        },
        reference: input.reference,
        brand_id: brandId,
      }),
    })
  } catch {
    return { error: 'The payout could not be started.', status: 'failed' as const }
  }

  const payout = await readBody(created) as PayoutRecord | null
  if (!created.ok || !payout?.id || !/^[0-9a-f-]{36}$/i.test(payout.id)) {
    return { error: providerMessage(payout, 'The payout could not be started.'), status: 'failed' as const }
  }

  const executionUrl = trustedExecutionUrl(payout.execution_url, base, payout.id)
  if (!executionUrl) {
    return { providerId: payout.id, error: 'The payout was created but could not be sent.', status: 'pending' as const }
  }

  const executeBody = input.channel === 'bank'
    ? {
        payout_type: 'bank',
        bank_name: input.bankName,
        bank_code: input.bankCode,
        bank_account_name: input.bankAccountName,
        bank_account_number: input.bankAccountNumber,
      }
    : { payout_type: 'mobile' }

  let executed: Response
  try {
    executed = await fetch(executionUrl, {
      method: 'POST',
      headers: paytotaHeaders(secret),
      body: JSON.stringify(executeBody),
    })
  } catch {
    return { providerId: payout.id, error: 'The payout was created but the send did not finish. Check its status.', status: 'pending' as const }
  }

  const execution = await readBody(executed) as PayoutRecord | null
  const state = payoutLedgerStatus(execution?.status || execution?.details?.transaction?.status)
  const returnCode = execution?.details?.return_code
  const rejected = !executed.ok || !execution || state === 'failed' || (returnCode != null && String(returnCode) !== '200')
  if (rejected) {
    return {
      providerId: payout.id,
      error: providerMessage(execution, 'The payout was not accepted.'),
      status: 'failed' as const,
    }
  }

  return {
    providerId: payout.id,
    status: state,
    message: typeof execution?.details?.message === 'string' ? clip(execution.details.message) : '',
  }
}

export async function readPaytotaPayout(id: string) {
  const base = paytotaBase()
  const secret = process.env.PAYTOTA_SECRET_KEY
  if (!base || !secret || !/^[A-Za-z0-9-]{8,80}$/.test(id)) return null

  const response = await fetch(`${base}/api/v1/payouts/${id}/`, {
    headers: paytotaHeaders(secret),
    cache: 'no-store',
  })
  if (!response.ok) return null
  return readBody(response) as Promise<PayoutRecord | null>
}

export async function applyPayoutUpdate(payout: PayoutRecord) {
  if (payout.type && payout.type !== 'payout') return 'pending' as const
  if (payout.event_type && !payout.event_type.startsWith('payout.')) return 'pending' as const
  if (!payout.id && !payout.reference) return 'pending' as const

  const state = payoutLedgerStatus(payout.status, payout.event_type)
  const message = providerMessage(payout, '')
  const admin = createAdminClient()
  await settlePayout(admin, 'provider_id', payout.id, state, message)
  await settlePayout(admin, 'reference', payout.reference, state, message)
  revalidatePath('/admin/payments')
  revalidatePath('/admin')
  return state
}

function paytotaBase() {
  return (process.env.PAYTOTA_BASE_URL || '').replace(/\/$/, '')
}

function paytotaHeaders(secret: string) {
  return {
    Authorization: `Bearer ${secret}`,
    Token: secret,
    'Content-Type': 'application/json',
  }
}

function trustedExecutionUrl(value: string | undefined, base: string, id: string) {
  const fallback = `${base}/po/${id}/paytota_proxy/`
  const candidate = value || fallback
  try {
    const target = new URL(candidate)
    const allowed = new URL(base)
    if (target.protocol !== 'https:' || target.host !== allowed.host) return ''
    if (!target.pathname.startsWith('/po/')) return ''
    return target.toString()
  } catch {
    return ''
  }
}

async function settlePayout(
  admin: ReturnType<typeof createAdminClient>,
  column: 'provider_id' | 'reference',
  value: string | undefined,
  state: 'paid' | 'failed' | 'pending',
  message: string,
) {
  if (!value) return
  const patch: { status: typeof state; provider_message?: string } = { status: state }
  if (message) patch.provider_message = message
  let query = admin.from('disbursements').update(patch).eq(column, value)
  if (state === 'pending') query = query.eq('status', 'pending')
  if (state === 'failed') query = query.neq('status', 'paid')
  await query
}

async function readBody(response: Response) {
  try {
    return await response.json() as PayoutRecord
  } catch {
    return null
  }
}

function providerMessage(body: PayoutRecord | null, fallback: string) {
  if (!body) return fallback
  if (typeof body.error === 'string') return clip(body.error) || fallback
  if (body.error && typeof body.error.message === 'string') return clip(body.error.message) || fallback
  if (typeof body.details?.message === 'string' && body.details.message) return clip(body.details.message)
  if (typeof body.message === 'string') return clip(body.message) || fallback
  if (typeof body.detail === 'string') return clip(body.detail) || fallback
  return fallback
}

function clip(value: string) {
  const text = value.replace(/\s+/g, ' ').trim()
  if (!text || text.length > 180) return ''
  return text
}
