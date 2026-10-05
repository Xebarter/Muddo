import type { Metadata } from 'next'
import { AccountPageHeader } from '@/components/account/account-page'
import { PaymentPlan } from '@/components/account/payment-plan'
import { MobilePaymentList } from '@/components/account/mobile-payment-list'
import { getPortal } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Payments | Account | Mudogwaluyiira Group',
}

export default async function PaymentsPage() {
  const portal = await getPortal()
  const due = portal?.installments.find((item) => item.status === 'Due soon' || item.status === 'Due')
  const service = portal?.services[0]

  return (
    <>
      <AccountPageHeader
        eyebrow="Payments"
        title="Payment plan"
        description={portal && due
          ? `${portal.paymentSummary.paid} paid. Next ${due.amount}, ${due.due}.`
          : 'No payment plan yet.'}
      />
      <PaymentPlan
        rows={portal?.installments}
        summary={portal?.paymentSummary}
        activeService={service ? { title: service.title, reference: service.reference } : { title: 'Your service', reference: '' }}
      />
      <MobilePaymentList rows={portal?.mobilePayments ?? []} />
    </>
  )
}
