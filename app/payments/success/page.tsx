import type { Metadata } from 'next'
import { PaymentResult } from '@/components/site/payment-result'

export const metadata: Metadata = { title: 'Payment received | Mudogwaluyiira Group' }

export default function PaymentSuccessPage() {
  return (
    <PaymentResult
      eyebrow="Mobile Money"
      title="Paid."
      text="Your payment is confirmed. The receipt downloads with the payment, and you can get it again from your profile after you sign in."
    />
  )
}
