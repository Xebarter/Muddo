'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

export async function recordPaymentAttempt(input: { reference: string; method: string; phone: string; note: string }) {
  const supabase = await createClient()
  const { data: installment, error: lookupError } = await supabase.from('installments').select('id').eq('reference', input.reference).maybeSingle()
  if (lookupError || !installment) return { error: 'The installment could not be found.' }

  const { error } = await supabase.from('payment_attempts').insert({
    installment_id: installment.id,
    method: input.method,
    phone: input.phone,
    note: input.note,
    status: 'pending',
  })

  if (error) return { error: 'The payment request could not be recorded.' }
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

export async function createActivity(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const title = String(formData.get('title') ?? '').trim()
  const { error } = await supabase.from('homepage_activities').insert({
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'activity',
    category: String(formData.get('category') ?? '').trim(),
    title,
    body: String(formData.get('body') ?? '').trim(),
    status: 'published',
    sort_order: 99,
  })
  if (error) return { error: 'The activity could not be published.' }
  revalidatePath('/')
  revalidatePath('/admin/homepage')
  return {}
}

export async function createGalleryItem(formData: FormData) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return { error: authError }
  const { error } = await supabase.from('gallery_items').insert({
    title: String(formData.get('title') ?? '').trim(),
    category: String(formData.get('category') ?? '').trim(),
    status: 'published',
    sort_order: 99,
  })
  if (error) return { error: 'The image record could not be added.' }
  revalidatePath('/')
  revalidatePath('/admin/gallery')
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
