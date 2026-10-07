import type { Metadata } from 'next'
import { PaymentResult } from '@/components/site/payment-result'

export const metadata: Metadata = { title: 'Payment not completed | Mudogwaluyiira Group' }

export default function PaymentFailurePage() {
  return (
    <PaymentResult
      eyebrow="Payment"
      title="Not paid"
      text="The payment was not completed. Open your payments and try again."
    />
  )
}
