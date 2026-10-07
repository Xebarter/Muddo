import type { Metadata } from 'next'
import { PaymentResult } from '@/components/site/payment-result'
import { getPortal } from '@/lib/data'
import { receiptHref } from '@/lib/save-receipt'

export const metadata: Metadata = { title: 'Payment received | Mudogwaluyiira Group' }

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<{ reference?: string | string[] }> }) {
  const params = await searchParams
  const raw = Array.isArray(params.reference) ? params.reference[0] : params.reference
  const reference = raw && /^[A-Za-z0-9-]{4,40}$/.test(raw) ? raw : ''
  const signedIn = reference ? Boolean(await getPortal()) : false

  return (
    <PaymentResult
      eyebrow="Payment"
      title="Payment received"
      text={signedIn ? 'Your payment is confirmed. Download the receipt, or find it later on your profile.' : 'Your payment is confirmed. Sign in and open your profile to download the receipt.'}
      receiptHref={signedIn ? receiptHref(reference) : undefined}
    />
  )
}
