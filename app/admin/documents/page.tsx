import { AdminPageHeader, RecordGrid } from '@/components/admin/admin-page'
import { SimpleCreateForm } from '@/components/admin/simple-create-form'
import { createDocument } from '@/lib/actions'
import { getAdminSnapshot } from '@/lib/data'

const fallback = [
  'House construction contract · John Doe · Awaiting review',
  'Payment receipt TXN-2048 · John Doe · Published',
  'Event quotation · Kato & Sons Ltd · Draft',
]

export default async function DocumentsPage() {
  const snapshot = await getAdminSnapshot()

  return (
    <>
      <AdminPageHeader
        eyebrow="Records & files"
        title="Document centre"
        description="Review contracts, quotations, receipts and project files before sharing them securely."
      />
      <RecordGrid rows={snapshot?.documents ?? fallback} />
      <SimpleCreateForm
        action={createDocument}
        submitLabel="File document"
        fields={[
          { name: 'name', label: 'Document name' },
          { name: 'doc_type', label: 'Type' },
          { name: 'detail', label: 'Detail', type: 'textarea' },
        ]}
      >
        <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
          Customer
          <select name="customer_id" required className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink">
            <option value="">Select a customer</option>
            {(snapshot?.customerOptions ?? []).map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
          Service
          <select name="service_id" className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink">
            <option value="">No specific service</option>
            {(snapshot?.serviceOptions ?? []).map((service) => <option key={service.id} value={service.id}>{service.label}</option>)}
          </select>
        </label>
      </SimpleCreateForm>
    </>
  )
}
