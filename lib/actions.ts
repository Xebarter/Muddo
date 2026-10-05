'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { employmentTypes, jobSlug, jobStatuses, type JobStatus } from '@/lib/careers'
import { formatUgx, installmentStatuses, receiptStatuses, requestStatuses, todayInKampala } from '@/lib/format'
import { applyMobileMoneyUpdate, normalizeMobileNumber, providerMarker, readMobileMoneyPurchase, requestMobileMoneyPrompt } from '@/lib/mobile-money'
import { suggestedNetwork, ugandaMobile } from '@/lib/payments/phone'
import { businesses } from '@/lib/businesses'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const paymentEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function submitContactMessage(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('submit_contact_message', {
    p_full_name: String(formData.get('full_name') ?? ''),
    p_email: String(formData.get('email') ?? ''),
    p_phone: String(formData.get('phone') ?? ''),
    p_subject: String(formData.get('subject') ?? ''),
    p_message: String(formData.get('message') ?? ''),
  })
  if (error) return { error: 'The message could not be sent. Run the latest Supabase script, then try again.' }
  revalidatePath('/admin/messages')
  revalidatePath('/admin')
  return {}
}

export async function submitServiceRequest(formData: FormData) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('submit_service_request', {
    p_full_name: String(formData.get('full_name') ?? ''),
    p_phone: String(formData.get('phone') ?? ''),
    p_email: String(formData.get('email') ?? ''),
    p_service: String(formData.get('service') ?? ''),
    p_location: String(formData.get('location') ?? ''),
    p_description: String(formData.get('description') ?? ''),
  })

  if (error) return { error: 'The request could not be saved. Run the Supabase script, then try again.' }
  revalidatePath('/admin')
  revalidatePath('/admin/service-requests')
  return { reference: data as string }
}

export async function saveProfileAction(profile: { name: string; email: string; phone: string; location: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to save your profile.' }

  const { error } = await supabase.from('profiles').update({
    full_name: profile.name,
    phone: profile.phone,
    location: profile.location,
  }).eq('id', user.id)

  if (error) return { error: 'The profile could not be saved.' }

  const { error: customerError } = await supabase.from('customers').update({
    full_name: profile.name,
    phone: profile.phone,
    location: profile.location,
  }).eq('profile_id', user.id)

  if (customerError) return { error: 'The profile could not be saved.' }

  revalidatePath('/account', 'layout')
  return {}
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: 'The notification could not be updated.' }
  revalidatePath('/account', 'layout')
  return {}
}

export async function startMobileMoneyPayment(input: { reference: string; phone: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to pay.' }

  const number = normalizeMobileNumber(input.phone)
  if (!number) return { error: 'Enter a phone number.' }

  const { data: installment, error: lookupError } = await supabase
    .from('installments')
    .select('id, amount, name, status, reference, service_id')
    .eq('reference', input.reference)
    .maybeSingle()
  if (lookupError || !installment) return { error: 'Not found.' }
  if (installment.status === 'paid') return { error: 'Already paid.' }
  if (installment.status === 'pending') return { error: 'Prompt already sent.' }
  if (!installment.amount || installment.amount <= 0) return { error: 'Cannot pay this.' }

  const { data: service } = await supabase.from('services').select('title, customer_id').eq('id', installment.service_id).maybeSingle()
  const { data: customer } = service
    ? await supabase.from('customers').select('email, full_name').eq('id', service.customer_id).maybeSingle()
    : { data: null }

  const prompted = await requestMobileMoneyPrompt({
    amount: Number(installment.amount),
    phone: number.phone,
    network: number.network,
    email: customer?.email || user.email || 'payments@mudogwaluyiira.ug',
    name: customer?.full_name || 'Customer',
    description: installment.name || service?.title || 'Installment',
    reference: `${installment.reference}-${Date.now()}`,
  })
  if (prompted.error || !prompted.id) return { error: prompted.error || 'Could not start.' }

  const admin = createAdminClient()
  await admin.from('installments').update({ status: 'pending', method: 'Mobile Money' }).eq('id', installment.id).neq('status', 'paid')

  const attempt = {
    installment_id: installment.id,
    method: 'Mobile Money',
    phone: number.phone,
    status: 'pending' as const,
    provider_id: prompted.id,
    provider_status: prompted.status,
    note: 'Approve the Mobile Money prompt on your phone.',
  }
  const inserted = await admin.from('payment_attempts').insert(attempt)
  if (inserted.error) {
    await admin.from('payment_attempts').insert({
      installment_id: installment.id,
      method: 'Mobile Money',
      phone: number.phone,
      status: 'pending',
      note: providerMarker(prompted.id),
    })
  }

  revalidatePath('/account/payments')
  revalidatePath('/admin/payments')
  return { state: 'pending' as const }
}

export async function refreshMobileMoneyPayment(reference: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to check.' }

  const { data: installment } = await supabase.from('installments').select('id, status').eq('reference', reference).maybeSingle()
  if (!installment) return { error: 'Not found.' }
  if (installment.status === 'paid') return { state: 'paid' as const }

  const admin = createAdminClient()
  const latest = await admin
    .from('payment_attempts')
    .select('provider_id, note')
    .eq('installment_id', installment.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const fallback = latest.error
    ? await admin.from('payment_attempts').select('note').eq('installment_id', installment.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    : null
  const attempt = latest.data ?? fallback?.data

  const providerId = attempt && 'provider_id' in attempt && attempt.provider_id
    ? attempt.provider_id
    : attempt?.note?.startsWith('mm:') ? attempt.note.slice(3) : ''
  if (!providerId) return { state: installment.status === 'pending' ? 'pending' as const : 'failed' as const }

  const purchase = await readMobileMoneyPurchase(providerId)
  if (!purchase) return { state: 'pending' as const }
  const state = await applyMobileMoneyUpdate(purchase)
  return { state }
}

export async function startOpenPayment(input: { email: string; phone: string; amount: string; network: string }) {
  const email = input.email.trim().toLowerCase()
  const phone = ugandaMobile(input.phone)
  const network = input.network === 'airtel' ? 'airtel' as const : input.network === 'mtnmomo' ? 'mtnmomo' as const : null
  const amount = Number(input.amount.replace(/[^\d]/g, ''))

  if (!paymentEmailPattern.test(email)) return { error: 'Enter an email.' }
  if (!phone || !network || suggestedNetwork(phone) !== network) return { error: 'Number and network do not match.' }
  if (!Number.isSafeInteger(amount) || amount < 500 || amount > 50_000_000) return { error: 'Enter UGX 500 to 50,000,000.' }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Payments are not ready yet.' }
  }

  const account = await ensurePaymentAccount(admin, email, `+${phone}`)
  if (!account.ok) return { error: account.error }

  const reference = `MG-PAY-${randomBytes(4).toString('hex').toUpperCase()}`
  const method = 'Mobile Money'
  const { error: insertError } = await admin.from('mobile_payments').insert({
    customer_id: account.customerId,
    email,
    phone: `+${phone}`,
    amount,
    method,
    status: 'pending',
    reference,
  })
  if (insertError) return { error: 'Could not save.' }

  const prompted = await requestMobileMoneyPrompt({
    amount,
    phone,
    network,
    email,
    name: account.name,
    description: 'Mudogwaluyiira payment',
    reference,
  })
  if (prompted.error || !prompted.id) {
    await admin.from('mobile_payments').update({ status: 'failed' }).eq('reference', reference)
    return { error: prompted.error || 'Prompt was not sent.' }
  }

  await admin.from('mobile_payments').update({ provider_id: prompted.id }).eq('reference', reference)
  revalidatePath('/account/payments')
  revalidatePath('/admin/payments')
  return {
    reference,
    email,
    phone: `+${phone}`,
    amount: formatUgx(amount),
    method,
    created: account.created,
    status: 'pending' as const,
  }
}

export async function refreshOpenPayment(reference: string) {
  if (!/^MG-PAY-[A-F0-9]{8}$/.test(reference)) return { error: 'Not found.' }
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Payments are not ready yet.' }
  }

  const { data, error } = await admin.from('mobile_payments').select('status, provider_id').eq('reference', reference).maybeSingle()
  if (error || !data) return { error: 'Not found.' }
  if (data.status !== 'pending' || !data.provider_id) return { status: data.status as 'pending' | 'paid' | 'failed' }

  const purchase = await readMobileMoneyPurchase(data.provider_id)
  if (!purchase) return { status: 'pending' as const }
  const status = await applyMobileMoneyUpdate(purchase)
  return { status }
}

function paymentName(email: string) {
  const local = email.split('@')[0]?.replace(/[._+-]+/g, ' ').replace(/\s+/g, ' ').trim() ?? ''
  return local.length < 2 ? 'Customer' : local.slice(0, 80)
}

async function ensurePaymentAccount(admin: ReturnType<typeof createAdminClient>, email: string, phone: string): Promise<{ ok: false; error: string } | { ok: true; customerId: string; created: boolean; name: string }> {
  const { data: profiles, error: profileError } = await admin.from('profiles').select('id, email')
  if (profileError) return { ok: false, error: 'Accounts are not ready.' }
  const profile = (profiles ?? []).find((item) => item.email?.toLowerCase() === email)

  const { data: customers, error: customerError } = await admin.from('customers').select('id, profile_id, email')
  if (customerError) return { ok: false, error: 'Accounts are not ready.' }
  const existing = (customers ?? []).find((item) => item.email?.toLowerCase() === email)

  let customerId = existing?.id ?? ''
  if (!existing) {
    const { data: inserted, error: insertError } = await admin.from('customers').insert({
      full_name: paymentName(email),
      email,
      phone,
      profile_id: profile?.id ?? null,
    }).select('id').single()
    if (insertError || !inserted) return { ok: false, error: 'Could not open an account.' }
    customerId = inserted.id
  } else if (phone) {
    await admin.from('customers').update({ phone }).eq('id', existing.id)
  }

  let created = false
  if (!profile && !existing?.profile_id) {
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: paymentName(email), phone },
      app_metadata: { role: 'customer', provider: 'payment' },
    })
    if (!createError) created = true
    else if (!/already|registered|exists/i.test(createError.message)) return { ok: false, error: 'Could not open an account.' }
  }

  return { ok: true, customerId, created, name: paymentName(email) }
}

export async function recordPaymentAttempt(input: { reference: string; method: string; phone: string; note: string }) {
  const supabase = await createClient()
  const { data: installment, error: lookupError } = await supabase.from('installments').select('id').eq('reference', input.reference).maybeSingle()
  if (lookupError || !installment) return { error: 'Not found.' }

  const { error } = await supabase.from('payment_attempts').insert({
    installment_id: installment.id,
    method: input.method,
    phone: input.phone,
    note: input.note,
    status: 'pending',
  })

  if (error) return { error: 'Could not save.' }
  revalidatePath('/account/payments')
  revalidatePath('/admin/payments')
  return {}
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') return { supabase, error: 'Admin access is required.' }
  return { supabase, error: null }
}

export async function createCustomer(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const { error } = await supabase.from('customers').insert({
    full_name: String(formData.get('full_name') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    phone: String(formData.get('phone') ?? '').trim(),
    location: String(formData.get('location') ?? '').trim(),
  })
  if (error) return { error: 'The customer could not be added.' }
  revalidatePath('/admin/customers')
  revalidatePath('/admin')
  return {}
}

export async function updateContactMessage(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const status = String(formData.get('status') ?? '')
  if (status !== 'new' && status !== 'read' && status !== 'replied') return { error: 'Choose a status.' }
  const { error } = await supabase.from('contact_messages').update({ status }).eq('id', String(formData.get('id') ?? ''))
  if (error) return { error: 'The message could not be updated. Run the latest Supabase script, then try again.' }
  revalidatePath('/admin/messages')
  revalidatePath('/admin')
  return {}
}

export async function deleteContactMessage(id: string) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const { error } = await supabase.from('contact_messages').delete().eq('id', id)
  if (error) return { error: 'The message could not be deleted.' }
  revalidatePath('/admin/messages')
  revalidatePath('/admin')
  return {}
}

function refreshRequests() {
  revalidatePath('/admin/service-requests')
  revalidatePath('/admin')
}

function requestFields(formData: FormData) {
  const name = String(formData.get('full_name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const phone = String(formData.get('phone') ?? '').trim()
  const service = String(formData.get('service') ?? '').trim()
  const location = String(formData.get('location') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const status = String(formData.get('status') ?? 'new')

  if (name.length < 2) return { error: 'Enter a full name.' }
  if (!paymentEmailPattern.test(email)) return { error: 'Enter a valid email.' }
  if (phone && phone.replace(/\D/g, '').length < 9) return { error: 'Enter a phone number.' }
  if (service.length < 2 || service.length > 80) return { error: 'Choose a service.' }
  if (location.length > 120) return { error: 'Shorten the location.' }
  if (description.length > 2000) return { error: 'Shorten the description.' }
  if (!requestStatuses.includes(status as (typeof requestStatuses)[number])) return { error: 'Choose a status.' }

  return { name, email, phone, service, location, description, status }
}

export async function saveServiceRequest(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const fields = requestFields(formData)
  if ('error' in fields) return { error: fields.error }

  const id = String(formData.get('id') ?? '')
  const record = {
    full_name: fields.name,
    email: fields.email,
    phone: fields.phone,
    service: fields.service,
    location: fields.location,
    description: fields.description,
    status: fields.status,
  }

  if (id) {
    const { error } = await supabase.from('service_requests').update(record).eq('id', id)
    if (error) return { error: 'The request could not be saved.' }
    refreshRequests()
    return {}
  }

  const { data, error } = await supabase.rpc('submit_service_request', {
    p_full_name: fields.name,
    p_phone: fields.phone,
    p_email: fields.email,
    p_service: fields.service,
    p_location: fields.location,
    p_description: fields.description,
  })
  if (error || !data) return { error: 'The request could not be saved.' }
  if (fields.status !== 'new') {
    const { error: statusError } = await supabase.from('service_requests').update({ status: fields.status }).eq('reference', data)
    if (statusError) return { error: 'The request was saved, but the status could not be set.' }
  }
  refreshRequests()
  return { reference: data as string }
}

export async function updateRequestStatus(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const status = String(formData.get('status') ?? '')
  if (!requestStatuses.includes(status as (typeof requestStatuses)[number])) return { error: 'Choose a status.' }
  const { error } = await supabase.from('service_requests').update({ status }).eq('id', String(formData.get('id') ?? ''))
  if (error) return { error: 'The request could not be updated.' }
  refreshRequests()
  return {}
}

export async function deleteServiceRequest(id: string) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const { error } = await supabase.from('service_requests').delete().eq('id', id)
  if (error) return { error: 'The request could not be deleted.' }
  refreshRequests()
  return {}
}

const serviceStatuses = ['planned', 'in_progress', 'completed', 'on_hold'] as const

export async function saveService(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const id = String(formData.get('id') ?? '')
  const customerId = String(formData.get('customer_id') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const division = businesses.find((item) => item.slug === String(formData.get('division') ?? ''))
  const location = String(formData.get('location') ?? '').trim()
  const stage = String(formData.get('stage') ?? '').trim()
  const progress = Number(formData.get('progress') ?? 0)
  const contractValue = Number(formData.get('contract_value') ?? 0)
  const status = String(formData.get('status') ?? '')
  const expected = String(formData.get('expected_completion') ?? '').trim()
  const image = String(formData.get('image_path') ?? '').trim()

  if (!customerId) return { error: 'Choose a customer.' }
  if (!division) return { error: 'Choose a division.' }
  if (title.length < 2) return { error: 'Enter a title.' }
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) return { error: 'Progress is 0 to 100.' }
  if (!Number.isSafeInteger(contractValue) || contractValue < 0) return { error: 'Enter a contract value.' }
  if (!serviceStatuses.includes(status as (typeof serviceStatuses)[number])) return { error: 'Choose a status.' }
  if (expected && !/^\d{4}-\d{2}-\d{2}$/.test(expected)) return { error: 'Enter a completion date.' }

  const record = {
    customer_id: customerId,
    title,
    division: division.title,
    location,
    progress,
    stage: stage || 'Not started',
    expected_completion: expected || null,
    status,
    contract_value: contractValue,
    image_path: image,
    updated_on: new Date().toISOString().slice(0, 10),
  }

  if (id) {
    const { error } = await supabase.from('services').update(record).eq('id', id)
    if (error) return { error: 'The service could not be saved. Run 0003services-image.sql, then try again.' }
    revalidatePath('/admin/services')
    revalidatePath('/admin')
    revalidatePath('/account')
    return { id }
  }

  const reference = `MG-SVC-${Date.now().toString().slice(-6)}`
  const { data, error } = await supabase.from('services').insert({ ...record, reference }).select('id').single()
  if (error || !data) return { error: 'The service could not be created. Run 0003services-image.sql, then try again.' }
  revalidatePath('/admin/services')
  revalidatePath('/admin')
  revalidatePath('/account')
  return { id: data.id as string }
}

export async function deleteService(id: string) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) return { error: 'The service could not be deleted.' }
  revalidatePath('/admin/services')
  revalidatePath('/admin')
  revalidatePath('/account')
  return {}
}

function progressFields(formData: FormData) {
  const serviceId = String(formData.get('service_id') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const progress = Number(formData.get('progress') ?? '')
  const publishedOn = String(formData.get('published_on') ?? '').trim()

  if (!serviceId) return { error: 'Choose a service.' }
  if (title.length < 2 || title.length > 120) return { error: 'Enter an update title.' }
  if (body.length > 2000) return { error: 'Shorten the update.' }
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) return { error: 'Progress is 0 to 100.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedOn)) return { error: 'Enter a published date.' }
  return { serviceId, title, body, progress, publishedOn }
}

function refreshProgress() {
  revalidatePath('/admin/progress')
  revalidatePath('/admin')
  revalidatePath('/admin/services')
  revalidatePath('/account')
  revalidatePath('/account/services')
}

async function syncLatestProgress(supabase: Awaited<ReturnType<typeof createClient>>, serviceId: string) {
  const { data, error } = await supabase
    .from('progress_updates')
    .select('progress, published_on')
    .eq('service_id', serviceId)
    .order('published_on', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return false
  if (!data) return true
  const { error: updateError } = await supabase.from('services').update({
    progress: data.progress,
    updated_on: data.published_on,
  }).eq('id', serviceId)
  return !updateError
}

export async function saveProgressUpdate(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const fields = progressFields(formData)
  if ('error' in fields) return { error: fields.error }

  const id = String(formData.get('id') ?? '')
  const record = {
    service_id: fields.serviceId,
    title: fields.title,
    body: fields.body,
    progress: fields.progress,
    published_on: fields.publishedOn,
  }

  let previousService = ''
  if (id) {
    const { data: existing, error: lookupError } = await supabase.from('progress_updates').select('service_id').eq('id', id).maybeSingle()
    if (lookupError || !existing) return { error: 'The update could not be saved.' }
    previousService = existing.service_id
    const { error } = await supabase.from('progress_updates').update(record).eq('id', id)
    if (error) return { error: error.code === '23503' ? 'Choose a service that still exists.' : 'The update could not be saved.' }
  } else {
    const { error } = await supabase.from('progress_updates').insert(record)
    if (error) return { error: error.code === '23503' ? 'Choose a service that still exists.' : 'The update could not be published.' }
  }

  const synced = await syncLatestProgress(supabase, fields.serviceId)
  const moved = previousService && previousService !== fields.serviceId ? await syncLatestProgress(supabase, previousService) : true
  if (!synced || !moved) return { error: 'The update was saved, but the service progress could not be refreshed.' }
  refreshProgress()
  return {}
}

export async function deleteProgressUpdate(id: string) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const { data: existing, error: lookupError } = await supabase.from('progress_updates').select('service_id').eq('id', id).maybeSingle()
  if (lookupError || !existing) return { error: 'The update could not be deleted.' }
  const { error } = await supabase.from('progress_updates').delete().eq('id', id)
  if (error) return { error: 'The update could not be deleted.' }
  const synced = await syncLatestProgress(supabase, existing.service_id)
  if (!synced) return { error: 'The update was deleted, but the service progress could not be refreshed.' }
  refreshProgress()
  return {}
}

export async function createDocument(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const { error } = await supabase.from('documents').insert({
    customer_id: String(formData.get('customer_id') ?? ''),
    service_id: String(formData.get('service_id') ?? '') || null,
    name: String(formData.get('name') ?? '').trim(),
    doc_type: String(formData.get('doc_type') ?? '').trim(),
    detail: String(formData.get('detail') ?? '').trim(),
    status: 'awaiting_review',
  })
  if (error) return { error: 'The document could not be filed.' }
  revalidatePath('/admin/documents')
  revalidatePath('/account/documents')
  return {}
}

function contentTable(kind: string) {
  return kind === 'gallery' ? 'gallery_items' : 'homepage_activities'
}

function refreshContent() {
  revalidatePath('/')
  revalidatePath('/admin/homepage')
  revalidatePath('/admin/gallery')
}

async function storeContentImage(supabase: Awaited<ReturnType<typeof createClient>>, file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return { url: '' }
  if (!file.type.startsWith('image/') || file.size > 5_000_000) return { error: 'Choose an image under 5 MB.' }
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${Date.now()}-${randomBytes(4).toString('hex')}.${extension}`
  const { error } = await supabase.storage.from('gallery').upload(path, file, { contentType: file.type })
  if (error) return { error: 'The image could not be uploaded. Run the Supabase script so the gallery bucket exists.' }
  return { url: supabase.storage.from('gallery').getPublicUrl(path).data.publicUrl }
}

export async function saveContentItem(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const kind = String(formData.get('kind') ?? '')
  const id = String(formData.get('id') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const status = String(formData.get('status') ?? 'draft')
  const imagePath = String(formData.get('image_path') ?? '').trim()
  const division = businesses.find((item) => item.slug === slug)

  if (!division) return { error: 'Choose a business division.' }
  if (title.length < 2) return { error: 'Enter a title.' }
  if (kind === 'activity' && body.length < 2) return { error: 'Enter the story.' }
  if (status !== 'draft' && status !== 'published') return { error: 'Choose draft or published.' }

  const uploaded = await storeContentImage(supabase, formData.get('image'))
  if (uploaded.error) return { error: uploaded.error }
  const image = uploaded.url || imagePath || '/mudogwaluyiira-hero.png'

  const record = {
    category: division.title,
    title,
    image_path: image,
    status,
    ...(kind === 'activity' ? { slug: division.slug, body } : {}),
  }

  if (id) {
    const { error } = await supabase.from(contentTable(kind)).update(record).eq('id', id)
    if (error) return { error: 'The record could not be saved.' }
    refreshContent()
    return { id }
  }

  const { count } = await supabase.from(contentTable(kind)).select('id', { count: 'exact', head: true })
  const { data, error } = await supabase.from(contentTable(kind)).insert({ ...record, sort_order: (count ?? 0) + 1 }).select('id').single()
  if (error || !data) return { error: 'The record could not be created.' }
  refreshContent()
  return { id: data.id }
}

export async function setContentStatus(kind: 'activity' | 'gallery', id: string, status: 'draft' | 'published') {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const { error } = await supabase.from(contentTable(kind)).update({ status }).eq('id', id)
  if (error) return { error: 'The status could not be changed.' }
  refreshContent()
  return {}
}

export async function moveContentItem(kind: 'activity' | 'gallery', id: string, direction: 'up' | 'down') {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const { data, error } = await supabase.from(contentTable(kind)).select('id, sort_order').order('sort_order').order('title')
  if (error || !data) return { error: 'The order could not be changed.' }
  const index = data.findIndex((item) => item.id === id)
  const next = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || next < 0 || next >= data.length) return {}
  const ordered = [...data]
  const [item] = ordered.splice(index, 1)
  ordered.splice(next, 0, item)
  const updates = ordered.map((row, position) => supabase.from(contentTable(kind)).update({ sort_order: position + 1 }).eq('id', row.id))
  const results = await Promise.all(updates)
  if (results.some((result) => result.error)) return { error: 'The order could not be changed.' }
  refreshContent()
  return {}
}

export async function saveHeroImage(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const uploaded = await storeContentImage(supabase, formData.get('image'))
  if (uploaded.error) return { error: uploaded.error }
  const imagePath = String(formData.get('image_path') ?? '').trim()
  const image = uploaded.url || imagePath || '/mudogwaluyiira-hero.png'
  const { error } = await supabase.from('homepage_settings').upsert({ id: 1, hero_image_path: image })
  if (error) return { error: 'The hero image could not be saved. Run the Supabase script, then try again.' }
  revalidatePath('/')
  revalidatePath('/admin/homepage')
  return {}
}

export async function saveWorkspaceSettings(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const { error } = await supabase.from('workspace_settings').upsert({
    id: 1,
    workspace_name: String(formData.get('workspace_name') ?? '').trim(),
    contact_name: String(formData.get('contact_name') ?? '').trim(),
    role_label: String(formData.get('role_label') ?? '').trim(),
    notification_email: String(formData.get('notification_email') ?? '').trim(),
  })
  if (error) return { error: 'Settings could not be saved.' }
  revalidatePath('/admin/settings')
  return {}
}

const cvTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function careerAdmin() {
  try {
    return { admin: createAdminClient(), error: '' }
  } catch {
    return { admin: null, error: 'Applications are not ready.' }
  }
}

export async function saveJob(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const id = String(formData.get('id') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const division = businesses.find((item) => item.slug === String(formData.get('division') ?? ''))
  const location = String(formData.get('location') ?? '').trim()
  const employmentType = String(formData.get('employment_type') ?? '')
  const summary = String(formData.get('summary') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const closing = String(formData.get('closing_on') ?? '').trim()
  const status = String(formData.get('status') ?? '')

  if (title.length < 2) return { error: 'Enter a job title.' }
  if (!division) return { error: 'Choose a division.' }
  if (location.length < 2) return { error: 'Enter a location.' }
  if (!employmentTypes.includes(employmentType as (typeof employmentTypes)[number])) return { error: 'Choose an employment type.' }
  if (summary.length < 2) return { error: 'Enter a short summary.' }
  if (description.length < 2) return { error: 'Enter the role description.' }
  if (!jobStatuses.includes(status as JobStatus)) return { error: 'Choose a status.' }
  if (closing && !/^\d{4}-\d{2}-\d{2}$/.test(closing)) return { error: 'Enter a closing date.' }

  const record = {
    title,
    division: division.title,
    location,
    employment_type: employmentType,
    summary,
    description,
    closing_on: closing || null,
    status,
  }

  if (id) {
    const { data, error } = await supabase.from('jobs').update(record).eq('id', id).select('slug').single()
    if (error || !data) return { error: 'The role could not be saved. Run 0006careers.sql, then try again.' }
    revalidatePath('/admin/careers')
    revalidatePath('/careers')
    revalidatePath(`/careers/${data.slug}`)
    return { id }
  }

  let slug = jobSlug(title)
  const { data: existing } = await supabase.from('jobs').select('slug').like('slug', `${slug}%`)
  if ((existing ?? []).some((item) => item.slug === slug)) slug = `${slug}-${randomBytes(2).toString('hex')}`
  const { data, error } = await supabase.from('jobs').insert({ ...record, slug }).select('id').single()
  if (error || !data) return { error: 'The role could not be created. Run 0006careers.sql, then try again.' }
  revalidatePath('/admin/careers')
  revalidatePath('/careers')
  return { id: data.id as string }
}

export async function deleteJob(id: string) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const { error } = await supabase.from('jobs').delete().eq('id', id)
  if (error) return { error: 'The role could not be deleted.' }
  revalidatePath('/admin/careers')
  revalidatePath('/careers')
  return {}
}

export async function updateJobApplication(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const status = String(formData.get('status') ?? '')
  if (!['new', 'reviewing', 'shortlisted', 'declined'].includes(status)) return { error: 'Choose a status.' }
  const { error } = await supabase.from('job_applications').update({ status }).eq('id', String(formData.get('id') ?? ''))
  if (error) return { error: 'The application could not be updated.' }
  revalidatePath('/admin/careers')
  return {}
}

export async function deleteJobApplication(id: string) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const { error } = await supabase.from('job_applications').delete().eq('id', id)
  if (error) return { error: 'The application could not be deleted.' }
  revalidatePath('/admin/careers')
  return {}
}

export async function submitJobApplication(formData: FormData) {
  const { admin, error: readyError } = careerAdmin()
  if (!admin) return { error: readyError }
  const jobId = String(formData.get('job_id') ?? '')
  const name = String(formData.get('full_name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const phone = String(formData.get('phone') ?? '').trim()
  const cover = String(formData.get('cover_letter') ?? '').trim()
  const file = formData.get('cv')

  if (name.length < 2) return { error: 'Enter your name.' }
  if (!paymentEmailPattern.test(email)) return { error: 'Enter a valid email.' }
  if (phone.replace(/\D/g, '').length < 9) return { error: 'Enter a phone number.' }
  if (cover.length < 20) return { error: 'Write a short cover letter.' }
  if (!(file instanceof File) || file.size === 0) return { error: 'Attach your CV.' }
  if (!cvTypes.has(file.type) || file.size > 5_000_000) return { error: 'Attach a PDF or Word CV under 5 MB.' }

  const { data: job, error: jobError } = await admin.from('jobs').select('id, slug, status, closing_on').eq('id', jobId).maybeSingle()
  const today = todayInKampala()
  if (jobError || !job || job.status !== 'published' || (job.closing_on && job.closing_on < today)) return { error: 'This role is not open.' }

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf'
  const path = `${job.id}/${Date.now()}-${randomBytes(4).toString('hex')}.${extension}`
  const { error: uploadError } = await admin.storage.from('applications').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type })
  if (uploadError) return { error: 'The CV could not be saved. Run 0006careers.sql, then try again.' }

  const { error } = await admin.from('job_applications').insert({
    job_id: job.id,
    full_name: name,
    email,
    phone,
    cover_letter: cover,
    cv_path: path,
  })
  if (error) return { error: 'The application could not be sent.' }
  revalidatePath('/admin/careers')
  revalidatePath(`/careers/${job.slug}`)
  return {}
}

function refreshPayments() {
  revalidatePath('/admin/payments')
  revalidatePath('/admin')
  revalidatePath('/account')
  revalidatePath('/account/payments')
}

function ledgerAmount(value: FormDataEntryValue | null) {
  const digits = String(value ?? '').replace(/[^\d]/g, '')
  if (!digits) return null
  const amount = Number(digits)
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1_000_000_000) return null
  return amount
}

function ledgerReference(prefix: string, value: string) {
  const cleaned = value.trim().toUpperCase().replace(/\s+/g, '-')
  if (!cleaned) return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}`
  if (!/^[A-Z0-9-]{4,40}$/.test(cleaned)) return ''
  return cleaned
}

function paymentError(error: { code?: string } | null, fallback: string) {
  if (!error) return ''
  if (error.code === '23505') return 'That reference is already in use.'
  if (error.code === '23503') return 'Choose a record that still exists.'
  return fallback
}

export async function saveInstallment(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const id = String(formData.get('id') ?? '')
  const serviceId = String(formData.get('service_id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const amount = ledgerAmount(formData.get('amount'))
  const dueOn = String(formData.get('due_on') ?? '')
  const status = String(formData.get('status') ?? '')
  const method = String(formData.get('method') ?? '').trim()
  const paidOnInput = String(formData.get('paid_on') ?? '').trim()
  const reference = ledgerReference('MG-INS', String(formData.get('reference') ?? ''))

  if (!serviceId) return { error: 'Choose a service.' }
  if (name.length < 2) return { error: 'Enter a payment name.' }
  if (amount === null) return { error: 'Enter an amount in whole shillings.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueOn)) return { error: 'Enter a due date.' }
  if (!installmentStatuses.includes(status as (typeof installmentStatuses)[number])) return { error: 'Choose a status.' }
  if (method.length > 40) return { error: 'Enter a shorter payment method.' }
  if (!reference) return { error: 'Use letters, numbers and hyphens for the reference.' }
  if (paidOnInput && !/^\d{4}-\d{2}-\d{2}$/.test(paidOnInput)) return { error: 'Enter the date it was paid.' }

  const record = {
    service_id: serviceId,
    name,
    amount,
    due_on: dueOn,
    paid_on: status === 'paid' ? (paidOnInput || todayInKampala()) : null,
    method: method || null,
    status,
    reference,
  }

  if (id) {
    const { error } = await supabase.from('installments').update(record).eq('id', id)
    const message = paymentError(error, 'The installment could not be saved.')
    if (message) return { error: message }
  } else {
    const { count } = await supabase.from('installments').select('id', { count: 'exact', head: true }).eq('service_id', serviceId)
    const { error } = await supabase.from('installments').insert({ ...record, sort_order: (count ?? 0) + 1 })
    const message = paymentError(error, 'The installment could not be saved.')
    if (message) return { error: message }
  }

  refreshPayments()
  return {}
}

export async function deleteInstallment(id: string) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const { data, error: readError } = await supabase.from('installments').select('status').eq('id', id).maybeSingle()
  if (readError || !data) return { error: 'The installment could not be deleted.' }
  if (data.status === 'paid') return { error: 'A completed payment cannot be deleted.' }
  const { error } = await supabase.from('installments').delete().eq('id', id).neq('status', 'paid')
  if (error) return { error: 'The installment could not be deleted.' }
  refreshPayments()
  return {}
}

export async function saveMobilePayment(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const id = String(formData.get('id') ?? '')
  const customerId = String(formData.get('customer_id') ?? '')
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const phone = String(formData.get('phone') ?? '').trim()
  const amount = ledgerAmount(formData.get('amount'))
  const method = String(formData.get('method') ?? '').trim()
  const status = String(formData.get('status') ?? '')
  const reference = ledgerReference('MG-PAY', String(formData.get('reference') ?? ''))

  if (!paymentEmailPattern.test(email)) return { error: 'Enter a valid email.' }
  if (phone.replace(/\D/g, '').length < 9) return { error: 'Enter a phone number.' }
  if (amount === null) return { error: 'Enter an amount in whole shillings.' }
  if (method.length < 2 || method.length > 40) return { error: 'Enter a payment method.' }
  if (!receiptStatuses.includes(status as (typeof receiptStatuses)[number])) return { error: 'Choose a status.' }
  if (!reference) return { error: 'Use letters, numbers and hyphens for the reference.' }

  const record = {
    customer_id: customerId || null,
    email,
    phone,
    amount,
    method,
    status,
    reference,
  }

  const { error } = id
    ? await supabase.from('mobile_payments').update(record).eq('id', id)
    : await supabase.from('mobile_payments').insert(record)
  const message = paymentError(error, 'The receipt could not be saved.')
  if (message) return { error: message }
  refreshPayments()
  return {}
}

export async function deleteMobilePayment(id: string) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const { data, error: readError } = await supabase.from('mobile_payments').select('status').eq('id', id).maybeSingle()
  if (readError || !data) return { error: 'The receipt could not be deleted.' }
  if (data.status === 'paid') return { error: 'A completed payment cannot be deleted.' }
  const { error } = await supabase.from('mobile_payments').delete().eq('id', id).neq('status', 'paid')
  if (error) return { error: 'The receipt could not be deleted.' }
  refreshPayments()
  return {}
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}
