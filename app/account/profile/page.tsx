import type { Metadata } from 'next'
import { AccountPageHeader } from '@/components/account/account-page'
import { ProfileForm } from '@/components/account/profile-form'
import { ReceiptList, type AccountReceipt } from '@/components/account/receipt-list'
import { getPortal } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Profile | Account | Mudogwaluyiira Group',
}

export default async function ProfilePage() {
  const portal = await getPortal()
  return (
    <>
      <AccountPageHeader
        eyebrow="Profile"
        title="Your details"
        description="Update your details, and download a receipt for any payment that has been confirmed."
      />
      <ProfileForm />
      <ReceiptList receipts={receiptsFor(portal)} />
    </>
  )
}

function receiptsFor(portal: Awaited<ReturnType<typeof getPortal>>): AccountReceipt[] {
  if (!portal) return []
  const installments = portal.installments.filter((item) => item.status === 'Paid').map((item) => ({
    reference: item.reference,
    title: item.name,
    amount: item.amount,
    date: item.paidOn || item.due,
    method: item.method || 'Payment',
  }))
  const mobile = portal.mobilePayments.filter((item) => item.status === 'Successful').map((item) => ({
    reference: item.reference,
    title: 'Mobile Money',
    amount: item.amount,
    date: item.date,
    method: item.method,
  }))
  return [...mobile, ...installments]
}