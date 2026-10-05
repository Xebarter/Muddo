import { AdminPageHeader } from '@/components/admin/admin-page'
import { PaymentDesk } from '@/components/admin/payment-ledger'
import { getPaymentLedger } from '@/lib/data'

export default async function PaymentsPage() {
  const ledger = await getPaymentLedger()

  return (
    <>
      <AdminPageHeader
        eyebrow="Finance"
        title="Payments"
        description="See what is still owed, what has been collected, and what has been paid out."
      />
      <PaymentDesk ledger={ledger} />
    </>
  )
}
