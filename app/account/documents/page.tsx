import type { Metadata } from 'next'
import { AccountPageHeader } from '@/components/account/account-page'
import { DocumentLibrary } from '@/components/account/document-library'
import { getPortal } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Documents | Account | Mudogwaluyiira Group',
}

export default async function DocumentsPage() {
  const portal = await getPortal()

  return (
    <>
      <AccountPageHeader
        eyebrow="Documents"
        title="Files for your service"
        description="Contracts, quotations and receipts filed against your services."
      />
      <DocumentLibrary documents={portal?.documents ?? []} />
    </>
  )
}
