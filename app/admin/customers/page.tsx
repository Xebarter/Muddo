import { AdminPageHeader, RecordGrid } from '@/components/admin/admin-page'
import { SimpleCreateForm } from '@/components/admin/simple-create-form'
import { createCustomer } from '@/lib/actions'
import { getAdminSnapshot } from '@/lib/data'

const fallback = [
  'John Doe · 2 active services · Kampala',
  'Mariam Namusoke · Event management · Entebbe',
  'David Ouma · Talent programme · Jinja',
]

export default async function CustomersPage() {
  const snapshot = await getAdminSnapshot()

  return (
    <>
      <AdminPageHeader
        eyebrow="Relationship management"
        title="Customer directory"
        description="Search profiles, review active services and keep every customer relationship moving."
      />
      <RecordGrid rows={snapshot?.customers.map((item) => item.label) ?? fallback} />
      <SimpleCreateForm
        action={createCustomer}
        submitLabel="Add customer"
        fields={[
          { name: 'full_name', label: 'Full name' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'phone', label: 'Phone' },
          { name: 'location', label: 'Location' },
        ]}
      />
    </>
  )
}
