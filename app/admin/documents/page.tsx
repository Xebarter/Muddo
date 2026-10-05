import { DocumentManager } from '@/components/admin/document-manager'
import { AdminPageHeader } from '@/components/admin/admin-page'
import { getManagedDocuments } from '@/lib/data'

export default async function DocumentsPage() {
  const records = await getManagedDocuments()

  return (
    <>
      <AdminPageHeader
        eyebrow="Records & files"
        title="Document centre"
        description="File, update, and remove contracts, quotations, receipts, and project files for each customer."
      />
      <DocumentManager
        documents={records?.documents ?? []}
        customers={records?.customers ?? []}
        services={records?.services ?? []}
        unavailable={records === null}
      />
    </>
  )
}
