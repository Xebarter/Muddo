export const customer = {
  name: 'John Doe',
  role: 'Customer',
  email: 'john.doe@example.com',
  phone: '+256 772 100 200',
  location: 'Kampala, Uganda',
}

export const service = {
  reference: 'MG-SVC-2026-0042',
  title: 'Residential House Construction',
  location: 'Kampala, Uganda',
  progress: 65,
  stage: 'Roofing works',
  updated: '04 Oct 2026',
  completion: '20 Dec 2026',
  status: 'In progress' as const,
  division: 'Construction',
}

export const timeline = [
  { label: 'Contract signed', date: '12 May 2026', state: 'complete' as const },
  { label: 'Foundation completed', date: '08 Jun 2026', state: 'complete' as const },
  { label: 'Wall construction', date: '22 Jul 2026', state: 'complete' as const },
  { label: 'Roofing works', date: 'In progress', state: 'current' as const },
  { label: 'Plumbing & electrical', state: 'upcoming' as const },
  { label: 'Finishing & handover', state: 'upcoming' as const },
]

export const installments = [
  { name: 'Deposit', amount: 'UGX 10,000,000', due: '10 May 2026', paidOn: '10 May 2026', method: 'MTN Mobile Money', status: 'Paid', tone: 'green' as const, reference: 'TXN-2041' },
  { name: 'Second payment', amount: 'UGX 15,000,000', due: '10 Jun 2026', paidOn: '10 Jun 2026', method: 'Airtel Money', status: 'Paid', tone: 'green' as const, reference: 'TXN-2044' },
  { name: 'Third payment', amount: 'UGX 20,000,000', due: '10 Aug 2026', paidOn: '04 Oct 2026', method: 'Bank transfer', status: 'Paid', tone: 'green' as const, reference: 'TXN-2048' },
  { name: 'Final payment', amount: 'UGX 35,000,000', due: '10 Nov 2026', status: 'Due soon', tone: 'gold' as const, reference: 'TXN-2052' },
]

export const paymentSummary = {
  paid: 'UGX 45,000,000',
  outstanding: 'UGX 35,000,000',
  total: 'UGX 80,000,000',
  paidWidth: '56%',
}

export const documents = [
  { id: 'contract', name: 'House construction contract', type: 'Contract', date: '12 May 2026', status: 'Signed', detail: 'The signed agreement for residential construction at your Kampala site, including scope, programme and payment terms.' },
  { id: 'receipt-2048', name: 'Payment receipt TXN-2048', type: 'Receipt', date: '04 Oct 2026', status: 'Available', detail: 'Receipt for the third installment of UGX 20,000,000, recorded against MG-SVC-2026-0042.' },
  { id: 'quotation', name: 'Project quotation', type: 'Quotation', date: '02 May 2026', status: 'Available', detail: 'The approved quotation that set the contract value at UGX 80,000,000 before works began.' },
]

export const notifications: { id: string; title: string; body: string; date: string; href: string; read?: boolean }[] = [
  { id: 'roofing', title: 'Roofing work has started', body: 'Our team has commenced roofing works. The structure is progressing well and remains on schedule.', date: '04 October 2026', href: '/account/services/mg-svc-2026-0042' },
  { id: 'payment', title: 'Final installment due soon', body: 'UGX 35,000,000 is due on 10 November 2026. You can review the plan and start payment from your account.', date: '01 October 2026', href: '/account/payments' },
  { id: 'inspection', title: 'Site inspection complete', body: 'The July inspection was accepted. Wall construction is recorded as complete.', date: '22 July 2026', href: '/account/services/mg-svc-2026-0042', read: true },
]
