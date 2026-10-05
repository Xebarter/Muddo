'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { formatUgx } from '@/lib/format'
import { applyMobileMoneyUpdate, normalizeMobileNumber, providerMarker, readMobileMoneyPurchase, requestMobileMoneyPrompt } from '@/lib/mobile-money'
import { suggestedNetwork, ugandaMobile } from '@/lib/payments/phone'
import { businesses } from '@/lib/businesses'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const paymentEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

export async function updateRequestStatus(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const { error } = await supabase.from('service_requests').update({
    status: String(formData.get('status') ?? 'new'),
  }).eq('id', String(formData.get('id') ?? ''))
  if (error) return { error: 'The request could not be updated.' }
  revalidatePath('/admin/service-requests')
  revalidatePath('/admin')
  return {}
}

export async function createService(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const reference = `MG-SVC-${Date.now().toString().slice(-6)}`
  const { error } = await supabase.from('services').insert({
    reference,
    customer_id: String(formData.get('customer_id') ?? ''),
    title: String(formData.get('title') ?? '').trim(),
    division: String(formData.get('division') ?? '').trim(),
    location: String(formData.get('location') ?? '').trim(),
    progress: 0,
    stage: 'Not started',
    status: 'planned',
    contract_value: Number(formData.get('contract_value') ?? 0) || 0,
  })
  if (error) return { error: 'The service could not be created.' }
  revalidatePath('/admin/services')
  revalidatePath('/admin')
  return {}
}

export async function createProgressUpdate(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const { error } = await supabase.from('progress_updates').insert({
    service_id: String(formData.get('service_id') ?? ''),
    title: String(formData.get('title') ?? '').trim(),
    body: String(formData.get('body') ?? '').trim(),
    progress: Number(formData.get('progress') ?? 0) || 0,
  })
  if (error) return { error: 'The update could not be published.' }
  revalidatePath('/admin/progress')
  revalidatePath('/account')
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
  } else {
    const { count } = await supabase.from(contentTable(kind)).select('id', { count: 'exact', head: true })
    const { error } = await supabase.from(contentTable(kind)).insert({ ...record, sort_order: (count ?? 0) + 1 })
    if (error) return { error: 'The record could not be created.' }
  }

  refreshContent()
  return {}
}

export async function deleteContentItem(kind: 'activity' | 'gallery', id: string) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const { error } = await supabase.from(contentTable(kind)).delete().eq('id', id)
  if (error) return { error: 'The record could not be deleted.' }
  refreshContent()
  return {}
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

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}
