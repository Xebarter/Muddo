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
        description="See what is still owed and what has been collected."
      />
      <PaymentDesk ledger={ledger} />
    </>
  )
}
