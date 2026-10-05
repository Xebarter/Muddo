import { AdminAction, AdminPageHeader, RecordGrid } from '@/components/admin/admin-page'

const documents = [
  'House construction contract · John Doe · Awaiting review',
  'Payment receipt TXN-2048 · John Doe · Published',
  'Event quotation · Kato & Sons Ltd · Draft',
]

export default function DocumentsPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Records & files"
        title="Document centre"
        description="Review contracts, quotations, receipts and project files before sharing them securely."
        action={<AdminAction>Upload document</AdminAction>}
      />
      <RecordGrid rows={documents} />
    </>
  )
}
