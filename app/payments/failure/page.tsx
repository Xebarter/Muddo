import type { Metadata } from 'next'
import { PaymentResult } from '@/components/site/payment-result'
import { cardFailureMessage } from '@/lib/mobile-money'

export const metadata: Metadata = { title: 'Payment not completed | Mudogwaluyiira Group' }

export default async function PaymentFailurePage({ searchParams }: { searchParams: Promise<{ reference?: string | string[] }> }) {
  const params = await searchParams
  const raw = Array.isArray(params.reference) ? params.reference[0] : params.reference
  const reference = raw && /^[A-Za-z0-9-]{4,40}$/.test(raw) ? raw : ''
  const detail = reference ? await cardFailureMessage(reference) : ''

  return (
    <PaymentResult
      eyebrow="Payment"
      title="Not paid"
      text={detail || 'The payment was not completed. Open your payments and try again.'}
    />
  )
}
