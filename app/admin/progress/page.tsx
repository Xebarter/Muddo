import { AdminAction, AdminPageHeader, RecordGrid } from '@/components/admin/admin-page'

const updates = [
  'Roofing work started · Residential construction · 65%',
  'Site inspection complete · Education development · 72%',
  'Final rehearsals · Corporate event · 80%',
]

export default function ProgressPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Customer delivery"
        title="Progress centre"
        description="Publish clear updates and keep customers informed at every stage of their service."
        action={<AdminAction>Publish update</AdminAction>}
      />
      <RecordGrid rows={updates} />
    </>
  )
}
