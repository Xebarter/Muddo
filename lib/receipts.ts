import { createHmac, timingSafeEqual } from 'crypto'
import { formatUgandaPhone } from '@/lib/contact'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type PaidReceipt = {
  reference: string
  amount: number
  paidOn: string
  payerName: string
  email: string
  phone: string
  method: string
  description: string
  service: string
}

const referencePattern = /^[A-Za-z0-9-]{4,40}$/

export function signReceipt(reference: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) return ''
  return createHmac('sha256', secret).update(`receipt:${reference}`).digest('base64url')
}

export function receiptSignatureMatches(reference: string, token: string) {
  const expected = signReceipt(reference)
  if (!expected || !token || token.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}

export async function loadPaidReceipt(reference: string, token: string) {
  if (!referencePattern.test(reference)) return null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const viewer = user ? { id: user.id, email: (user.email || '').toLowerCase() } : null
  const tokenOk = receiptSignatureMatches(reference, token)
  if (!viewer && !tokenOk) return null

  try {
    const admin = createAdminClient()
    const mobile = await mobileReceipt(admin, reference)
    if (mobile && (tokenOk || owns(viewer, mobile.email, mobile.profileId))) return mobile.receipt
    const installment = await installmentReceipt(admin, reference)
    if (installment && (tokenOk || owns(viewer, installment.email, installment.profileId))) return installment.receipt
  } catch {
    return null
  }
  return null
}

function owns(viewer: { id: string; email: string } | null, email: string, profileId: string) {
  if (!viewer) return false
  if (profileId && profileId === viewer.id) return true
  return Boolean(viewer.email) && email.toLowerCase() === viewer.email
}

async function mobileReceipt(admin: ReturnType<typeof createAdminClient>, reference: string) {
  const { data } = await admin.from('mobile_payments').select('email, phone, amount, method, status, reference, created_at, customer_id').eq('reference', reference).maybeSingle()
  if (!data || data.status !== 'paid') return null
  let name = ''
  let profileId = ''
  if (data.customer_id) {
    const customer = await admin.from('customers').select('full_name, profile_id').eq('id', data.customer_id).maybeSingle()
    name = customer.data?.full_name ?? ''
    profileId = customer.data?.profile_id ?? ''
  }
  return {
    email: data.email,
    profileId,
    receipt: {
      reference: data.reference,
      amount: Number(data.amount),
      paidOn: data.created_at,
      payerName: name || nameFromEmail(data.email),
      email: data.email,
      phone: formatUgandaPhone(data.phone) || data.phone,
      method: data.method || 'Mobile Money',
      description: 'Mudogwaluyiira payment',
      service: '',
    } satisfies PaidReceipt,
  }
}

async function installmentReceipt(admin: ReturnType<typeof createAdminClient>, reference: string) {
  const { data } = await admin.from('installments').select('name, amount, paid_on, method, status, reference, service_id').eq('reference', reference).maybeSingle()
  if (!data || data.status !== 'paid') return null
  const service = await admin.from('services').select('title, customer_id').eq('id', data.service_id).maybeSingle()
  const customer = service.data
    ? await admin.from('customers').select('full_name, email, phone, profile_id').eq('id', service.data.customer_id).maybeSingle()
    : { data: null }
  return {
    email: customer.data?.email ?? '',
    profileId: customer.data?.profile_id ?? '',
    receipt: {
      reference: data.reference,
      amount: Number(data.amount),
      paidOn: data.paid_on || '',
      payerName: customer.data?.full_name || 'Customer',
      email: customer.data?.email ?? '',
      phone: formatUgandaPhone(customer.data?.phone || '') || customer.data?.phone || '',
      method: data.method || 'Payment',
      description: data.name,
      service: service.data?.title ?? '',
    } satisfies PaidReceipt,
  }
}

function nameFromEmail(email: string) {
  const local = email.split('@')[0]?.replace(/[._+-]+/g, ' ').replace(/\s+/g, ' ').trim() ?? ''
  if (local.length < 2) return 'Customer'
  return local.replace(/\b\w/g, (letter) => letter.toUpperCase())
}
