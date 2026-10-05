import type { Metadata } from 'next'
import { PaymentResult } from '@/components/site/payment-result'

export const metadata: Metadata = { title: 'Payment not completed | Mudogwaluyiira Group' }

export default function PaymentFailurePage() {
  return (
    <PaymentResult
      eyebrow="Mobile Money"
      title="Not paid."
      text="Try again."
    />
  )
}
