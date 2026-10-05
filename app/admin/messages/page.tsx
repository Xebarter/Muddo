import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page'
import { ContactInbox } from '@/components/admin/contact-inbox'
import { getContactMessages } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Messages | Admin | Mudogwaluyiira Group',
}

export default async function MessagesPage() {
  const messages = await getContactMessages()
  const unread = messages?.filter((item) => item.rawStatus === 'new').length ?? 0

  return (
    <>
      <AdminPageHeader
        eyebrow="Contact"
        title="Messages"
        description={messages
          ? `${unread} new ${unread === 1 ? 'message' : 'messages'} from the public contact page.`
          : 'Read and reply to messages sent from the contact page.'}
      />
      <ContactInbox messages={messages ?? []} unavailable={messages === null} />
    </>
  )
}
