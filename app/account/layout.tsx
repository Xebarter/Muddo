import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AccountShell } from '@/components/account/account-shell'
import { getPortal } from '@/lib/data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Account | Mudogwaluyiira Group',
  description: 'Review your Mudogwaluyiira services, payments, documents and updates.',
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const portal = await getPortal()
  if (!portal) redirect('/login')
  const unread = portal.notifications.filter((item) => !item.read).length
  return <AccountShell profile={portal.profile} unread={unread}>{children}</AccountShell>
}
