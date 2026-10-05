import { AdminPageHeader, RecordGrid } from '@/components/admin/admin-page'
import { PaymentLedger } from '@/components/admin/payment-ledger'
import { getAdminSnapshot } from '@/lib/data'

const fallbackLedger = [
  'TXN-2048 · UGX 20,000,000 · Successful',
  'TXN-2047 · UGX 8,500,000 · Successful',
  'TXN-2046 · UGX 1,200,000 · Pending',
]

const fallbackPayments = [
  { customer: 'John Doe', service: 'Residential construction', amount: 'UGX 20,000,000', date: '04 Oct 2026', status: 'Successful' },
  { customer: 'Mariam Namusoke', service: 'Event management', amount: 'UGX 8,500,000', date: '03 Oct 2026', status: 'Successful' },
  { customer: 'David Ouma', service: 'Talent programme', amount: 'UGX 1,200,000', date: '02 Oct 2026', status: 'Pending' },
]

export default async function PaymentsPage() {
  const snapshot = await getAdminSnapshot()

  return (
    <>
      <AdminPageHeader
        eyebrow="Payments"
        title="Ledger"
        description="Pending until confirmed."
      />
      <RecordGrid rows={snapshot ? snapshot.payments.map((item) => `${item.customer} · ${item.amount} · ${item.status}`) : fallbackLedger} />
      <PaymentLedger payments={snapshot?.payments ?? fallbackPayments} />
    </>
  )
}
