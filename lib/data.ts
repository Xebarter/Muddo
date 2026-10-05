import { cache } from 'react'
import { businesses } from '@/lib/businesses'
import { applicationStatuses, jobStatuses, type ApplicationStatus, type JobStatus } from '@/lib/careers'
import { createClient } from '@/lib/supabase/server'
import {
  customer,
  documents as demoDocuments,
  installments as demoInstallments,
  notifications as demoNotifications,
  paymentSummary as demoPaymentSummary,
  service as demoService,
  timeline as demoTimeline,
} from '@/lib/account'
import {
  documentLabel,
  formatLongDate,
  formatRequestWhen,
  todayInKampala,
  formatShortUgx,
  formatUgx,
  installmentLabel,
  paymentLabel,
  requestLabel,
  requestTone,
  serviceLabel,
} from '@/lib/format'

export type PortalProfile = {
  name: string
  email: string
  phone: string
  location: string
  role: string
  avatar: string
}

export type PortalService = {
  reference: string
  title: string
  location: string
  progress: number
  stage: string
  updated: string
  completion: string
  status: string
  division: string
  timeline: { label: string; date?: string; state: 'complete' | 'current' | 'upcoming' }[]
  latestUpdate: { title: string; body: string; date: string } | null
}

export type PortalInstallment = {
  id: string
  name: string
  amount: string
  due: string
  paidOn?: string
  method?: string
  status: string
  tone: 'gold' | 'green' | 'muted'
  reference: string
}

export type PortalDocument = {
  id: string
  name: string
  type: string
  date: string
  status: string
  detail: string
}

export type PortalNotification = {
  id: string
  title: string
  body: string
  date: string
  href: string
  read?: boolean
}

export type PortalMobilePayment = {
  reference: string
  amount: string
  method: string
  status: string
  date: string
}

export type PortalData = {
  profile: PortalProfile
  services: PortalService[]
  installments: PortalInstallment[]
  paymentSummary: { paid: string; outstanding: string; total: string; paidWidth: string }
  documents: PortalDocument[]
  notifications: PortalNotification[]
  mobilePayments: PortalMobilePayment[]
}

const demoPortal = (): PortalData => ({
  profile: { ...customer, role: customer.role, avatar: '' },
  services: [{
    ...demoService,
    timeline: demoTimeline,
    latestUpdate: {
      title: 'Roofing work has started',
      body: 'Our team has commenced roofing works. The structure is progressing well and remains on schedule.',
      date: '04 October 2026',
    },
  }],
  installments: demoInstallments.map((item) => ({ ...item, id: item.reference })),
  paymentSummary: demoPaymentSummary,
  documents: demoDocuments,
  notifications: demoNotifications,
  mobilePayments: [],
})

export const getPortal = cache(async (): Promise<PortalData | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error: profileError } = await supabase.from('profiles').select('full_name, email, phone, location, role').eq('id', user.id).maybeSingle()
  if (profileError) return demoPortal()

  const rawEmail = profile?.email || user.email || ''
  const accountProfile: PortalProfile = {
    name: profile?.full_name || 'Customer',
    email: rawEmail.endsWith('@phone.mudogwaluyiira.ug') ? '' : rawEmail,
    phone: profile?.phone || user.phone || '',
    location: profile?.location || '',
    role: profile?.role === 'admin' ? 'Admin' : 'Customer',
    avatar: typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : '',
  }

  const { data: owned, error: customerError } = await supabase.from('customers').select('id').eq('profile_id', user.id).maybeSingle()
  if (customerError) return { ...demoPortal(), profile: accountProfile }
  const mobilePayments = await mobilePaymentsFor(supabase, accountProfile.email)
  if (!owned) {
    return { profile: accountProfile, services: [], installments: [], paymentSummary: { paid: formatUgx(0), outstanding: formatUgx(0), total: formatUgx(0), paidWidth: '0%' }, documents: [], notifications: [], mobilePayments }
  }

  const [{ data: services }, { data: documents }, { data: notifications }] = await Promise.all([
    supabase.from('services').select('id, reference, title, location, progress, stage, expected_completion, status, division, updated_on, contract_value').eq('customer_id', owned.id).order('created_at'),
    supabase.from('documents').select('id, name, doc_type, status, detail, filed_on').eq('customer_id', owned.id).order('filed_on', { ascending: false }),
    supabase.from('notifications').select('id, title, body, href, read_at, created_at').eq('customer_id', owned.id).order('created_at', { ascending: false }),
  ])

  const serviceIds = (services ?? []).map((item) => item.id)
  const [{ data: milestones }, { data: updates }, { data: installments }] = await Promise.all([
    serviceIds.length ? supabase.from('service_milestones').select('service_id, label, occurred_on, state, sort_order').in('service_id', serviceIds).order('sort_order') : Promise.resolve({ data: [] }),
    serviceIds.length ? supabase.from('progress_updates').select('service_id, title, body, published_on').in('service_id', serviceIds).order('published_on', { ascending: false }) : Promise.resolve({ data: [] }),
    serviceIds.length ? supabase.from('installments').select('id, service_id, name, amount, due_on, paid_on, method, status, reference, sort_order').in('service_id', serviceIds).order('sort_order') : Promise.resolve({ data: [] }),
  ])

  const portalServices: PortalService[] = (services ?? []).map((item) => {
    const latest = (updates ?? []).find((update) => update.service_id === item.id)
    return {
      reference: item.reference,
      title: item.title,
      location: item.location,
      progress: item.progress,
      stage: item.stage,
      updated: formatLongDate(item.updated_on),
      completion: formatLongDate(item.expected_completion),
      status: serviceLabel(item.status),
      division: item.division,
      timeline: (milestones ?? []).filter((step) => step.service_id === item.id).map((step) => ({
        label: step.label,
        date: step.state === 'current' ? 'In progress' : formatLongDate(step.occurred_on) || undefined,
        state: step.state as PortalService['timeline'][number]['state'],
      })),
      latestUpdate: latest ? { title: latest.title, body: latest.body, date: formatLongDate(latest.published_on) } : null,
    }
  })

  const rows = installments ?? []
  const paid = rows.filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount), 0)
  const outstanding = rows.filter((item) => item.status !== 'paid').reduce((sum, item) => sum + Number(item.amount), 0)
  const total = paid + outstanding

  return {
    profile: accountProfile,
    services: portalServices,
    installments: rows.map((item) => ({
      id: item.id,
      name: item.name,
      amount: formatUgx(Number(item.amount)),
      due: formatLongDate(item.due_on),
      paidOn: item.paid_on ? formatLongDate(item.paid_on) : undefined,
      method: item.method ?? undefined,
      status: installmentLabel(item.status),
      tone: item.status === 'paid' ? 'green' : item.status === 'pending' || item.status === 'due_soon' ? 'gold' : 'muted',
      reference: item.reference,
    })),
    paymentSummary: {
      paid: formatUgx(paid),
      outstanding: formatUgx(outstanding),
      total: formatUgx(total),
      paidWidth: total ? `${Math.round((paid / total) * 100)}%` : '0%',
    },
    documents: (documents ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      type: item.doc_type,
      date: formatLongDate(item.filed_on),
      status: documentLabel(item.status),
      detail: item.detail,
    })),
    notifications: (notifications ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      date: formatLongDate(item.created_at),
      href: item.href,
      read: Boolean(item.read_at),
    })),
    mobilePayments,
  }
})

async function mobilePaymentsFor(supabase: Awaited<ReturnType<typeof createClient>>, email: string): Promise<PortalMobilePayment[]> {
  if (!email) return []
  const { data, error } = await supabase.from('mobile_payments').select('reference, amount, method, status, created_at').eq('email', email.toLowerCase()).order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []).map((item) => ({
    reference: item.reference,
    amount: formatUgx(Number(item.amount)),
    method: item.method,
    status: paymentLabel(item.status),
    date: formatLongDate(item.created_at),
  }))
}

export type PublicContent = {
  activities: { id: string; title: string; text: string; category: string; slug: string; image: string }[]
  gallery: { id: string; title: string; category: string; image: string }[]
}

const defaultHeroImage = '/mudogwaluyiira-hero.png'

export type GalleryPhoto = { id: string; image: string }

export function uniquePhotos(photos: GalleryPhoto[]) {
  const seen = new Set<string>()
  return photos.filter((photo) => {
    if (!photo.image || seen.has(photo.image)) return false
    seen.add(photo.image)
    return true
  })
}

export const getGalleryPhotos = cache(async (): Promise<{ photos: GalleryPhoto[]; work: GalleryPhoto[]; uploads: GalleryPhoto[] } | null> => {
  const supabase = await createClient()
  const [{ data: activities, error: activityError }, { data: uploads, error: uploadError }] = await Promise.all([
    supabase.from('homepage_activities').select('id, image_path, sort_order').eq('status', 'published').order('sort_order'),
    supabase.from('gallery_items').select('id, image_path, sort_order, status').order('sort_order'),
  ])
  if (activityError || uploadError) return null
  const work = uniquePhotos((activities ?? []).map((item) => ({ id: `work-${item.id}`, image: item.image_path })))
  const seen = new Set(work.map((photo) => photo.image))
  const extra = (uploads ?? []).flatMap((item) => {
    if (item.status !== 'published' || !item.image_path || seen.has(item.image_path)) return []
    seen.add(item.image_path)
    return [{ id: item.id, image: item.image_path }]
  })
  return {
    work,
    uploads: (uploads ?? []).flatMap((item) => (item.image_path ? [{ id: item.id, image: item.image_path }] : [])),
    photos: [...work, ...extra],
  }
})

export const getHomepageHero = cache(async (): Promise<{ image: string; unavailable: boolean }> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from('homepage_settings').select('hero_image_path').eq('id', 1).maybeSingle()
  if (error) return { image: defaultHeroImage, unavailable: true }
  return { image: data?.hero_image_path || defaultHeroImage, unavailable: false }
})

export const getPublicContent = cache(async (): Promise<PublicContent | null> => {
  const supabase = await createClient()
  const [{ data: activities, error: activityError }, { data: gallery, error: galleryError }] = await Promise.all([
    supabase.from('homepage_activities').select('id, slug, category, title, body, image_path, sort_order').eq('status', 'published').order('sort_order'),
    supabase.from('gallery_items').select('id, title, category, image_path, sort_order').eq('status', 'published').order('sort_order'),
  ])
  if (activityError || galleryError) return null
  return {
    activities: activities.map((item) => ({ id: item.id, title: item.title, text: item.body, category: item.category, slug: item.slug, image: item.image_path })),
    gallery: (gallery ?? []).map((item) => ({ id: item.id, title: item.title, category: item.category, image: item.image_path })),
  }
})

export type AdminSnapshot = {
  customers: { id: string; label: string }[]
  customerOptions: { id: string; name: string }[]
  serviceOptions: { id: string; label: string }[]
  requests: { id: string; reference: string; name: string; service: string; location: string; date: string; status: string; rawStatus: string; tone: 'gold' | 'green' | 'muted' }[]
  services: { label: string }[]
  portfolio: { label: string; count: number }[]
  payments: { customer: string; service: string; amount: string; date: string; status: string }[]
  progress: string[]
  documents: string[]
  activities: string[]
  gallery: string[]
  settings: { workspace_name: string; contact_name: string; role_label: string; notification_email: string }
  metrics: { customers: string; activeServices: string; revenue: string; outstanding: string; divisions: string; dueMilestones: string; documentsToReview: string; completed: string }
}

export const getAdminSnapshot = cache(async (): Promise<AdminSnapshot | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') return null

  const [
    customers,
    requests,
    services,
    payments,
    mobilePayments,
    progress,
    documents,
    activities,
    gallery,
    settings,
  ] = await Promise.all([
    supabase.from('customers').select('id, full_name, location, email').order('full_name'),
    supabase.from('service_requests').select('id, reference, full_name, service, location, status, created_at').order('created_at', { ascending: false }),
    supabase.from('services').select('id, reference, title, division, progress, status, customer_id').order('created_at', { ascending: false }),
    supabase.from('installments').select('amount, status, paid_on, due_on, reference, service_id').order('due_on', { ascending: false }),
    supabase.from('mobile_payments').select('email, amount, status, created_at, method').order('created_at', { ascending: false }),
    supabase.from('progress_updates').select('title, progress, published_on, service_id').order('published_on', { ascending: false }),
    supabase.from('documents').select('name, status, doc_type, customer_id').order('filed_on', { ascending: false }),
    supabase.from('homepage_activities').select('category, title, status').order('sort_order'),
    supabase.from('gallery_items').select('title, category, status').order('sort_order'),
    supabase.from('workspace_settings').select('workspace_name, contact_name, role_label, notification_email').eq('id', 1).maybeSingle(),
  ])

  if (customers.error || requests.error || services.error) return null

  const customerName = new Map((customers.data ?? []).map((item) => [item.id, item.full_name]))
  const serviceById = new Map((services.data ?? []).map((item) => [item.id, item]))
  const serviceCounts = new Map<string, number>()
  for (const service of services.data ?? []) {
    const count = serviceCounts.get(service.customer_id) ?? 0
    if (service.status === 'in_progress' || service.status === 'planned') serviceCounts.set(service.customer_id, count + 1)
  }

  const divisions = new Map<string, number>()
  for (const service of services.data ?? []) {
    if (service.status !== 'in_progress') continue
    divisions.set(service.division, (divisions.get(service.division) ?? 0) + 1)
  }

  const mobileRows = mobilePayments.error ? [] : (mobilePayments.data ?? [])
  const paid = (payments.data ?? []).filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount), 0)
    + mobileRows.filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount), 0)
  const outstanding = (payments.data ?? []).filter((item) => item.status !== 'paid').reduce((sum, item) => sum + Number(item.amount), 0)
    + mobileRows.filter((item) => item.status === 'pending').reduce((sum, item) => sum + Number(item.amount), 0)
  const active = (services.data ?? []).filter((item) => item.status === 'in_progress').length
  const completed = (services.data ?? []).filter((item) => item.status === 'completed').length
  const reviewDocs = (documents.data ?? []).filter((item) => item.status === 'awaiting_review' || item.status === 'draft').length

  return {
    customers: (customers.data ?? []).map((item) => ({
      id: item.id,
      label: `${item.full_name} · ${serviceCounts.get(item.id) ?? 0} active services · ${item.location || 'Uganda'}`,
    })),
    customerOptions: (customers.data ?? []).map((item) => ({ id: item.id, name: item.full_name })),
    serviceOptions: (services.data ?? []).map((item) => ({ id: item.id, label: `${item.reference} · ${item.title}` })),
    requests: (requests.data ?? []).map((item) => ({
      id: item.id,
      reference: item.reference,
      name: item.full_name,
      service: item.service,
      location: item.location,
      date: formatRequestWhen(item.created_at),
      status: requestLabel(item.status),
      tone: requestTone(item.status),
      rawStatus: item.status,
    })),
    services: (services.data ?? []).map((item) => ({ label: `${item.reference} · ${item.title} · ${item.progress}%` })),
    portfolio: [...divisions.entries()].map(([label, count]) => ({ label, count })),
    payments: [
      ...mobileRows.map((item) => ({
        customer: item.email,
        service: item.method,
        amount: formatUgx(Number(item.amount)),
        date: formatLongDate(item.created_at),
        status: paymentLabel(item.status),
      })),
      ...(payments.data ?? []).map((item) => {
        const service = serviceById.get(item.service_id)
        return {
          customer: service ? customerName.get(service.customer_id) ?? 'Customer' : 'Customer',
          service: service?.title ?? 'Service',
          amount: formatUgx(Number(item.amount)),
          date: formatLongDate(item.paid_on || item.due_on),
          status: paymentLabel(item.status),
        }
      }),
    ],
    progress: (progress.data ?? []).map((item) => {
      const service = serviceById.get(item.service_id)
      return `${item.title} · ${service?.title ?? 'Service'} · ${item.progress}%`
    }),
    documents: (documents.data ?? []).map((item) => `${item.name} · ${customerName.get(item.customer_id) ?? 'Customer'} · ${documentLabel(item.status)}`),
    activities: (activities.data ?? []).map((item) => `${item.category} · ${item.title} · ${item.status === 'published' ? 'Published' : 'Draft'}`),
    gallery: (gallery.data ?? []).map((item) => `Photo · ${item.status === 'published' ? 'Published' : 'Draft'}`),
    settings: settings.data ?? {
      workspace_name: 'Mudogwaluyiira operations',
      contact_name: 'Admin Manager',
      role_label: 'Operations',
      notification_email: 'muddogwaluyiiragroup@gmail.com',
    },
    metrics: {
      customers: String((customers.data ?? []).length),
      activeServices: String(active),
      revenue: formatShortUgx(paid),
      outstanding: formatShortUgx(outstanding),
      divisions: String(divisions.size || 0),
      dueMilestones: String((services.data ?? []).filter((item) => item.status === 'in_progress').length),
      documentsToReview: String(reviewDocs),
      completed: String(completed),
    },
  }
})

export type LedgerInstallment = {
  id: string
  serviceId: string
  serviceLabel: string
  customerName: string
  name: string
  amount: number
  dueOn: string
  paidOn: string
  method: string
  status: 'paid' | 'due' | 'due_soon' | 'pending' | 'failed'
  reference: string
}

export type LedgerReceipt = {
  id: string
  customerId: string
  customerName: string
  email: string
  phone: string
  amount: number
  method: string
  status: 'pending' | 'paid' | 'failed'
  reference: string
  createdOn: string
}

export type PaymentLedgerData = {
  installments: LedgerInstallment[]
  receipts: LedgerReceipt[]
  services: { id: string; label: string }[]
  customers: { id: string; name: string; email: string; phone: string }[]
  collected: number
  outstanding: number
}

const installmentStatusList = ['paid', 'due', 'due_soon', 'pending', 'failed'] as const
const receiptStatusList = ['pending', 'paid', 'failed'] as const

export const getPaymentLedger = cache(async (): Promise<PaymentLedgerData | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') return null

  const [installments, receipts, services, customers] = await Promise.all([
    supabase.from('installments').select('id, service_id, name, amount, due_on, paid_on, method, status, reference'),
    supabase.from('mobile_payments').select('id, customer_id, email, phone, amount, method, status, reference, created_at').order('created_at', { ascending: false }),
    supabase.from('services').select('id, reference, title, customer_id').order('reference'),
    supabase.from('customers').select('id, full_name, email, phone').order('full_name'),
  ])
  if (installments.error || receipts.error || services.error || customers.error) return null

  const customerRows = customers.data ?? []
  const customerName = new Map(customerRows.map((item) => [item.id, item.full_name]))
  const customerByEmail = new Map(customerRows.map((item) => [item.email.toLowerCase(), item.full_name]))
  const serviceRows = services.data ?? []
  const serviceById = new Map(serviceRows.map((item) => [item.id, item]))
  const statusRank: Record<string, number> = { due_soon: 0, due: 1, pending: 2, failed: 3, paid: 4 }

  const ledgerInstallments = (installments.data ?? []).map((item) => {
    const service = serviceById.get(item.service_id)
    const status = installmentStatusList.includes(item.status as (typeof installmentStatusList)[number]) ? item.status as LedgerInstallment['status'] : 'due'
    return {
      id: item.id,
      serviceId: item.service_id,
      serviceLabel: service ? `${service.reference} · ${service.title}` : 'Service',
      customerName: service ? customerName.get(service.customer_id) ?? 'Customer' : 'Customer',
      name: item.name,
      amount: Number(item.amount),
      dueOn: item.due_on,
      paidOn: item.paid_on ?? '',
      method: item.method ?? '',
      status,
      reference: item.reference,
    }
  }).sort((a, b) => (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9) || a.dueOn.localeCompare(b.dueOn))

  const ledgerReceipts = (receipts.data ?? []).map((item) => {
    const status = receiptStatusList.includes(item.status as (typeof receiptStatusList)[number]) ? item.status as LedgerReceipt['status'] : 'pending'
    return {
      id: item.id,
      customerId: item.customer_id ?? '',
      customerName: (item.customer_id && customerName.get(item.customer_id)) || customerByEmail.get(item.email.toLowerCase()) || item.email,
      email: item.email,
      phone: item.phone,
      amount: Number(item.amount),
      method: item.method,
      status,
      reference: item.reference,
      createdOn: item.created_at,
    }
  })

  const collected = ledgerInstallments.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0)
    + ledgerReceipts.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0)
  const outstanding = ledgerInstallments.filter((item) => item.status !== 'paid').reduce((sum, item) => sum + item.amount, 0)
    + ledgerReceipts.filter((item) => item.status === 'pending').reduce((sum, item) => sum + item.amount, 0)

  return {
    installments: ledgerInstallments,
    receipts: ledgerReceipts,
    services: serviceRows.map((item) => ({
      id: item.id,
      label: `${item.reference} · ${item.title} · ${customerName.get(item.customer_id) ?? 'Customer'}`,
    })),
    customers: customerRows.map((item) => ({ id: item.id, name: item.full_name, email: item.email, phone: item.phone })),
    collected,
    outstanding,
  }
})

export type ContactMessage = {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  date: string
  status: string
  rawStatus: 'new' | 'read' | 'replied'
  tone: 'gold' | 'green' | 'muted'
}

export const getContactMessages = cache(async (): Promise<ContactMessage[] | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') return null

  const { data, error } = await supabase
    .from('contact_messages')
    .select('id, full_name, email, phone, subject, message, status, created_at')
    .order('created_at', { ascending: false })

  if (error) return null
  return (data ?? []).map((item) => ({
    id: item.id,
    name: item.full_name,
    email: item.email,
    phone: item.phone,
    subject: item.subject,
    message: item.message,
    date: formatRequestWhen(item.created_at),
    status: item.status === 'replied' ? 'Replied' : item.status === 'read' ? 'Read' : 'New',
    rawStatus: item.status === 'replied' || item.status === 'read' ? item.status : 'new',
    tone: item.status === 'replied' ? 'green' as const : item.status === 'read' ? 'muted' as const : 'gold' as const,
  }))
})

export type ManagedContent = {
  id: string
  slug: string
  category: string
  title: string
  body: string
  image: string
  sortOrder: number
  status: 'draft' | 'published'
}

export async function getManagedContent(kind: 'activity' | 'gallery'): Promise<ManagedContent[] | null> {
  const supabase = await createClient()
  const query = kind === 'gallery'
    ? supabase.from('gallery_items').select('id, title, category, image_path, sort_order, status').order('sort_order').order('title')
    : supabase.from('homepage_activities').select('id, slug, category, title, body, image_path, sort_order, status').order('sort_order').order('title')
  const { data, error } = await query
  if (error) return null
  return (data ?? []).map((item) => ({
    id: item.id,
    slug: 'slug' in item ? item.slug : '',
    category: item.category,
    title: item.title,
    body: 'body' in item ? item.body : '',
    image: item.image_path,
    sortOrder: item.sort_order,
    status: item.status === 'draft' ? 'draft' : 'published',
  }))
}

export type ManagedService = {
  id: string
  reference: string
  customerId: string
  customerName: string
  title: string
  division: string
  location: string
  progress: number
  stage: string
  expectedCompletion: string
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold'
  contractValue: number
  image: string
  displayImage: string
  usingHomepageImage: boolean
}

const serviceStatusList = ['planned', 'in_progress', 'completed', 'on_hold'] as const

function homepageImageFor(
  division: string,
  activities: { slug: string; category: string; image_path: string; status: string }[],
  hero: string,
) {
  const business = businesses.find((item) => item.title.toLowerCase() === division.toLowerCase() || item.slug === division)
  const related = activities.filter((item) => {
    if (!item.image_path) return false
    if (business) return item.slug === business.slug || item.category.toLowerCase() === business.title.toLowerCase()
    return item.category.toLowerCase() === division.toLowerCase()
  })
  const published = related.find((item) => item.status === 'published')
  return published?.image_path || related[0]?.image_path || hero || defaultHeroImage
}

export async function getManagedServices(): Promise<{ services: ManagedService[]; customers: { id: string; name: string }[]; homepageImages: Record<string, string> } | null> {
  const supabase = await createClient()
  const [services, customers, activities, hero] = await Promise.all([
    supabase.from('services').select('id, reference, customer_id, title, division, location, progress, stage, expected_completion, status, contract_value, image_path').order('created_at', { ascending: false }),
    supabase.from('customers').select('id, full_name').order('full_name'),
    supabase.from('homepage_activities').select('slug, category, image_path, status, sort_order').order('sort_order'),
    supabase.from('homepage_settings').select('hero_image_path').eq('id', 1).maybeSingle(),
  ])
  if (services.error || customers.error) return null
  const names = new Map((customers.data ?? []).map((item) => [item.id, item.full_name]))
  const stories = activities.error ? [] : (activities.data ?? [])
  const heroImage = hero.data?.hero_image_path || defaultHeroImage
  const homepageImages = Object.fromEntries(businesses.map((business) => [business.slug, homepageImageFor(business.title, stories, heroImage)]))
  return {
    customers: (customers.data ?? []).map((item) => ({ id: item.id, name: item.full_name })),
    homepageImages,
    services: (services.data ?? []).map((item) => {
      const own = item.image_path?.trim() ?? ''
      const status = serviceStatusList.includes(item.status as (typeof serviceStatusList)[number]) ? item.status as ManagedService['status'] : 'planned'
      return {
        id: item.id,
        reference: item.reference,
        customerId: item.customer_id,
        customerName: names.get(item.customer_id) ?? 'Customer',
        title: item.title,
        division: item.division,
        location: item.location,
        progress: item.progress,
        stage: item.stage,
        expectedCompletion: item.expected_completion ?? '',
        status,
        contractValue: Number(item.contract_value),
        image: own,
        displayImage: own || homepageImageFor(item.division, stories, heroImage),
        usingHomepageImage: !own,
      }
    }),
  }
}

export type PublicJob = {
  id: string
  slug: string
  title: string
  division: string
  location: string
  employmentType: string
  summary: string
  description: string
  closingOn: string
  closed: boolean
}

export type ManagedJob = PublicJob & { status: JobStatus }

export type JobApplicationRecord = {
  id: string
  jobId: string
  jobTitle: string
  name: string
  email: string
  phone: string
  coverLetter: string
  cvUrl: string
  date: string
  status: string
  rawStatus: ApplicationStatus
  tone: 'gold' | 'green' | 'muted'
}

function mapJob(item: { id: string; slug: string; title: string; division: string; location: string; employment_type: string; summary: string; description: string; closing_on: string | null; status: string }, today: string): PublicJob {
  const closingOn = item.closing_on ?? ''
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    division: item.division,
    location: item.location,
    employmentType: item.employment_type,
    summary: item.summary,
    description: item.description,
    closingOn,
    closed: item.status === 'closed' || Boolean(closingOn && closingOn < today),
  }
}

export async function getPublicJobs(): Promise<PublicJob[] | null> {
  const supabase = await createClient()
  const today = todayInKampala()
  const { data, error } = await supabase.from('jobs').select('id, slug, title, division, location, employment_type, summary, description, closing_on, status').eq('status', 'published').order('created_at', { ascending: false })
  if (error) return null
  return (data ?? []).map((item) => mapJob(item, today)).filter((item) => !item.closed)
}

export async function getPublicJob(slug: string): Promise<PublicJob | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('jobs').select('id, slug, title, division, location, employment_type, summary, description, closing_on, status').eq('slug', slug).maybeSingle()
  if (error || !data || (data.status !== 'published' && data.status !== 'closed')) return null
  return mapJob(data, todayInKampala())
}

export async function getManagedJobs(): Promise<ManagedJob[] | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') return null
  const { data, error } = await supabase.from('jobs').select('id, slug, title, division, location, employment_type, summary, description, closing_on, status').order('created_at', { ascending: false })
  if (error) return null
  const today = todayInKampala()
  return (data ?? []).map((item) => ({
    ...mapJob(item, today),
    status: jobStatuses.includes(item.status as JobStatus) ? item.status as JobStatus : 'draft',
  }))
}

export async function getJobApplications(): Promise<JobApplicationRecord[] | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') return null
  const { data, error } = await supabase.from('job_applications').select('id, job_id, full_name, email, phone, cover_letter, cv_path, status, created_at, jobs(title)').order('created_at', { ascending: false })
  if (error) return null
  const rows = data ?? []
  const links = await Promise.all(rows.map(async (item) => {
    if (!item.cv_path) return ''
    const signed = await supabase.storage.from('applications').createSignedUrl(item.cv_path, 60 * 60)
    return signed.data?.signedUrl ?? ''
  }))
  return rows.map((item, index) => {
    const rawStatus = applicationStatuses.includes(item.status as ApplicationStatus) ? item.status as ApplicationStatus : 'new'
    const job = item.jobs as { title?: string } | { title?: string }[] | null
    const jobTitle = Array.isArray(job) ? job[0]?.title : job?.title
    return {
      id: item.id,
      jobId: item.job_id,
      jobTitle: jobTitle || 'Role',
      name: item.full_name,
      email: item.email,
      phone: item.phone,
      coverLetter: item.cover_letter,
      cvUrl: links[index],
      date: formatRequestWhen(item.created_at),
      status: rawStatus === 'shortlisted' ? 'Shortlisted' : rawStatus === 'reviewing' ? 'Reviewing' : rawStatus === 'declined' ? 'Declined' : 'New',
      rawStatus,
      tone: rawStatus === 'shortlisted' ? 'green' as const : rawStatus === 'declined' ? 'muted' as const : 'gold' as const,
    }
  })
}
