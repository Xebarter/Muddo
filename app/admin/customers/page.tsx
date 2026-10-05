import { AdminAction, AdminPageHeader, RecordGrid } from '@/components/admin/admin-page'

const customers = [
  'John Doe · 2 active services · Kampala',
  'Mariam Namusoke · Event management · Entebbe',
  'David Ouma · Talent programme · Jinja',
]

export default function CustomersPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Relationship management"
        title="Customer directory"
        description="Search profiles, review active services and keep every customer relationship moving."
        action={<AdminAction>Add customer</AdminAction>}
      />
      <RecordGrid rows={customers} />
    </>
  )
}
