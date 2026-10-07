import type { Metadata } from 'next'
import { PaymentResult } from '@/components/site/payment-result'

export const metadata: Metadata = { title: 'Payment cancelled | Mudogwaluyiira Group' }

export default function PaymentCancelPage() {
  return (
    <PaymentResult
      eyebrow="Payment"
      title="Cancelled"
      text="The payment was cancelled. Open your payments and try again."
    />
  )
}
