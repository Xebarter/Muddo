import { createVerify, type KeyObject, createPublicKey } from 'crypto'
import { revalidatePath } from 'next/cache'
import { suggestedNetwork } from '@/lib/payments/phone'
import { createAdminClient } from '@/lib/supabase/admin'

const paidStatuses = new Set(['paid', 'captured'])
const failedStatuses = new Set(['error', 'failed', 'cancelled', 'canceled', 'expired', 'refunded', 'released', 'charged_back'])

type Purchase = {
  id?: string
  status?: string
  reference?: string
  event_type?: string
  checkout_url?: string
  details?: { return_code?: string | number; message?: string; transaction?: { status?: string } }
}

export function normalizeMobileNumber(input: string) {
  const digits = input.replace(/\D/g, '')
  let local = digits
  if (local.startsWith('256')) local = local.slice(3)
  else if (local.startsWith('0')) local = local.slice(1)
  if (!/^\d{9}$/.test(local)) return null

  const prefix = local.slice(0, 2)
  const network: 'mtnmomo' | 'airtel' | null = ['76', '77', '78', '79', '31', '39'].includes(prefix)
    ? 'mtnmomo'
    : ['70', '74', '75', '20'].includes(prefix)
      ? 'airtel'
      : null
  if (!network) return null

  return { phone: `256${local}`, network }
}

export async function requestMobileMoneyPrompt(input: {
  amount: number
  phone: string
  network: 'mtnmomo' | 'airtel'
  email: string
  name: string
  description: string
  reference: string
}) {
  const base = (process.env.PAYTOTA_BASE_URL || '').replace(/\/$/, '')
  const secret = process.env.PAYTOTA_SECRET_KEY
  const brandId = process.env.PAYTOTA_BRAND_ID
  if (!base || !secret || !brandId) return { error: 'Payments are not ready.' as const }

  if (suggestedNetwork(input.phone) !== input.network) {
    return { error: 'Number and network do not match.' as const }
  }

  const site = (process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://muddogroup.com').replace(/\/$/, '')
  const created = await fetch(`${base}/api/v1/purchases/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client: {
        email: input.email,
        phone: input.phone,
        country: 'UG',
        full_name: input.name,
      },
      purchase: {
        currency: 'UGX',
        products: [{ name: input.description.slice(0, 80) || 'Mudogwaluyiira payment', price: String(input.amount) }],
      },
      reference: input.reference,
      brand_id: brandId,
      skip_capture: false,
      success_redirect: process.env.PAYTOTA_SUCCESS_REDIRECT || `${site}/payments/success`,
      failure_redirect: process.env.PAYTOTA_FAILURE_REDIRECT || `${site}/payments/failure`,
      cancel_redirect: process.env.PAYTOTA_CANCEL_REDIRECT || `${site}/payments/cancel`,
      success_callback: `${site}${process.env.PAYTOTA_WEBHOOK_PATH || '/api/paytota/webhook'}`,
    }),
  })

  const purchase = await readJson(created)
  if (!created.ok || !purchase?.id) return { error: 'Could not start.' as const }

  const form = new FormData()
  form.set('s2s', 'true')
  form.set('pm', 'paytota_proxy')
  const executed = await fetch(`${base}/p/${purchase.id}/`, { method: 'POST', body: form })
  const execution = await readJson(executed)
  const returnCode = execution?.details?.return_code
  const executionStatus = (execution?.status || execution?.details?.transaction?.status || '').toLowerCase()
  const rejected = !executed.ok || !execution || executionStatus === 'error' || executionStatus === 'failed' || (returnCode != null && String(returnCode) !== '200')
  if (rejected) return { error: 'Prompt was not sent.' as const }

  return { id: purchase.id, status: executionStatus || 'pending' }
}

export async function requestCardCheckout(input: {
  amount: number
  email: string
  name: string
  phone: string
  city: string
  description: string
  reference: string
  returnReference: string
}) {
  const base = (process.env.PAYTOTA_BASE_URL || '').replace(/\/$/, '')
  const secret = process.env.PAYTOTA_SECRET_KEY
  const brandId = process.env.PAYTOTA_BRAND_ID
  if (!base || !secret || !brandId) return { error: 'Payments are not ready.' as const }

  const site = (process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://muddogroup.com').replace(/\/$/, '')
  const place = input.city.trim().slice(0, 40) || 'Kampala'
  const receiptReference = /^[A-Za-z0-9-]{4,40}$/.test(input.returnReference) ? input.returnReference : ''
  const client: Record<string, string> = {
    email: input.email,
    full_name: input.name,
    country: 'UG',
    city: place,
    state: place,
    street_address: place,
    zip_code: '256',
  }
  if (input.phone) client.phone = input.phone
  const created = await fetch(`${base}/api/v1/purchases/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client,
      purchase: {
        currency: 'UGX',
        products: [{ name: input.description.slice(0, 80) || 'Mudogwaluyiira payment', price: input.amount }],
      },
      reference: input.reference,
      brand_id: brandId,
      skip_capture: false,
      success_redirect: receiptReference
        ? `${site}/payments/success?reference=${encodeURIComponent(receiptReference)}`
        : (process.env.PAYTOTA_SUCCESS_REDIRECT || `${site}/payments/success`),
      failure_redirect: process.env.PAYTOTA_FAILURE_REDIRECT || `${site}/payments/failure`,
      cancel_redirect: process.env.PAYTOTA_CANCEL_REDIRECT || `${site}/payments/cancel`,
      success_callback: `${site}${process.env.PAYTOTA_WEBHOOK_PATH || '/api/paytota/webhook'}`,
    }),
  })

  const purchase = await readJson(created)
  const checkoutUrl = trustedCheckoutUrl(purchase?.checkout_url)
  if (!created.ok || !purchase?.id || !checkoutUrl) return { error: 'The card payment could not be started.' as const }
  return { id: purchase.id, checkoutUrl }
}

export async function readMobileMoneyPurchase(id: string) {
  const base = (process.env.PAYTOTA_BASE_URL || '').replace(/\/$/, '')
  const secret = process.env.PAYTOTA_SECRET_KEY
  if (!base || !secret) return null

  const response = await fetch(`${base}/api/v1/purchases/${id}/`, {
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  if (!response.ok) return null
  return readJson(response)
}

export function paymentState(status: string | undefined, eventType?: string) {
  const value = (status || '').toLowerCase()
  if (paidStatuses.has(value)) return 'paid' as const
  if (failedStatuses.has(value)) return 'failed' as const
  if (eventType === 'purchase.paid' || eventType === 'purchase.captured') return 'paid' as const
  if (eventType === 'purchase.payment_failure' || eventType === 'purchase.cancelled') return 'failed' as const
  return 'pending' as const
}

async function settlePayment(
  admin: ReturnType<typeof createAdminClient>,
  column: 'provider_id' | 'reference',
  value: string | undefined,
  state: 'paid' | 'failed' | 'pending',
) {
  if (!value) return
  let query = admin.from('mobile_payments').update({ status: state }).eq(column, value)
  if (state === 'pending') query = query.eq('status', 'pending')
  if (state === 'failed') query = query.neq('status', 'paid')
  await query
}

export async function applyMobileMoneyUpdate(purchase: Purchase) {
  if (purchase.event_type && !purchase.event_type.startsWith('purchase.')) return 'pending' as const
  if (!purchase.id && !purchase.reference) return 'pending' as const
  const state = paymentState(purchase.status, purchase.event_type)
  const admin = createAdminClient()
  await settlePayment(admin, 'provider_id', purchase.id, state)
  await settlePayment(admin, 'reference', purchase.reference, state)
  if (!purchase.id) return state
  const attempt = await findAttempt(admin, purchase.id)
  if (!attempt) return state
  if (state === 'pending' && attempt.status !== 'pending') return state
  if (state === 'failed' && attempt.status === 'confirmed') return state

  const attemptStatus = state === 'paid' ? 'confirmed' : state === 'failed' ? 'failed' : 'pending'
  await admin.from('payment_attempts').update({
    status: attemptStatus,
    provider_status: purchase.status || purchase.event_type || '',
  }).eq('id', attempt.id)

  const method = attempt.method === 'Card' ? 'Card' : 'Mobile Money'
  if (state === 'paid') {
    await admin.from('installments').update({
      status: 'paid',
      paid_on: kampalaDate(),
      method,
    }).eq('id', attempt.installment_id).neq('status', 'paid')
  } else if (state === 'failed') {
    await admin.from('installments').update({
      status: 'due_soon',
      method,
    }).eq('id', attempt.installment_id).eq('status', 'pending')
  }

  revalidatePath('/account/payments')
  revalidatePath('/account')
  revalidatePath('/admin/payments')
  revalidatePath('/admin')
  return state
}

export async function verifyMobileMoneySignature(rawBody: string, signature: string) {
  const signatureBytes = Buffer.from(signature, 'base64')
  const keys = [pemFromEnv(), await remotePublicKey()].filter(Boolean)
  return keys.some((pem) => verifyWithKey(pem, rawBody, signatureBytes))
}

async function findAttempt(admin: ReturnType<typeof createAdminClient>, providerId: string) {
  const byProvider = await admin.from('payment_attempts').select('id, installment_id, status, method').eq('provider_id', providerId).maybeSingle()
  if (!byProvider.error && byProvider.data) return byProvider.data

  const byNote = await admin.from('payment_attempts').select('id, installment_id, status, method').eq('note', providerMarker(providerId)).maybeSingle()
  return byNote.data
}

function providerMarker(id: string) {
  return `mm:${id}`
}

export { providerMarker }

function kampalaDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kampala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

async function readJson(response: Response) {
  try {
    return await response.json() as Purchase
  } catch {
    return null
  }
}

function trustedCheckoutUrl(value: string | undefined) {
  if (!value) return ''
  try {
    const target = new URL(value)
    const allowed = new Set(['payments.paytota.com', 'gate.paytota.com'])
    const base = process.env.PAYTOTA_BASE_URL
    if (base) allowed.add(new URL(base).host)
    if (target.protocol !== 'https:' || !allowed.has(target.host) || !target.pathname.includes('/p/')) return ''
    return target.toString()
  } catch {
    return ''
  }
}

function pemFromEnv() {
  const raw = process.env.PAYTOTA_WEBHOOK_PUBLIC_KEY || ''
  const normalized = raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw
  return normalized.includes('BEGIN') && normalized.includes('END') ? normalized : ''
}

let cachedRemoteKey = ''

async function remotePublicKey() {
  if (cachedRemoteKey) return cachedRemoteKey
  const url = process.env.PAYTOTA_PUBLIC_KEY_URL
  const secret = process.env.PAYTOTA_SECRET_KEY
  if (!url) return ''
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    })
    const text = await response.text()
    cachedRemoteKey = pemFromText(text)
  } catch {
    cachedRemoteKey = ''
  }
  return cachedRemoteKey
}

function pemFromText(text: string) {
  const trimmed = text.trim()
  if (trimmed.includes('BEGIN')) return trimmed
  try {
    const parsed = JSON.parse(trimmed) as { public_key?: string; key?: string }
    const value = parsed.public_key || parsed.key || ''
    return value.includes('BEGIN') ? value.replace(/\\n/g, '\n') : ''
  } catch {
    return ''
  }
}

function verifyWithKey(pem: string, payload: string, signature: Buffer) {
  try {
    const key: KeyObject = createPublicKey(pem)
    const verifier = createVerify('SHA256')
    verifier.update(payload)
    verifier.end()
    return verifier.verify(key, signature)
  } catch {
    return false
  }
}
