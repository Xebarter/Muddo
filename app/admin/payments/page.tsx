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
        description="Record what each service owes, confirm what has been paid, and keep every Mobile Money receipt in one ledger."
      />
      <PaymentDesk ledger={ledger} />
    </>
  )
}
