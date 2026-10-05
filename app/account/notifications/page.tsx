import type { Metadata } from 'next'
import { AccountPageHeader } from '@/components/account/account-page'
import { NotificationList } from '@/components/account/notification-list'
import { getPortal } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Notifications | Account | Mudogwaluyiira Group',
}

export default async function NotificationsPage() {
  const portal = await getPortal()
  const unread = portal?.notifications.filter((item) => !item.read).length ?? 0

  return (
    <>
      <AccountPageHeader
        eyebrow="Notifications"
        title="Updates for you"
        description={`${unread} unread updates about your service and payments.`}
      />
      <NotificationList items={portal?.notifications ?? []} />
    </>
  )
}
