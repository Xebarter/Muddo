import { AdminPageHeader, RecordGrid } from '@/components/admin/admin-page'
import { SimpleCreateForm } from '@/components/admin/simple-create-form'
import { createProgressUpdate } from '@/lib/actions'
import { getAdminSnapshot } from '@/lib/data'

const fallback = [
  'Roofing work started · Residential construction · 65%',
  'Site inspection complete · Education development · 72%',
  'Final rehearsals · Corporate event · 80%',
]

export default async function ProgressPage() {
  const snapshot = await getAdminSnapshot()

  return (
    <>
      <AdminPageHeader
        eyebrow="Customer delivery"
        title="Progress centre"
        description="Publish clear updates and keep customers informed at every stage of their service."
      />
      <RecordGrid rows={snapshot?.progress ?? fallback} />
      <SimpleCreateForm
        action={createProgressUpdate}
        submitLabel="Publish update"
        fields={[
          { name: 'title', label: 'Update title' },
          { name: 'body', label: 'What changed', type: 'textarea' },
          { name: 'progress', label: 'Progress percent', type: 'number' },
        ]}
      >
        <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
          Service
          <select name="service_id" required className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink">
            <option value="">Select a service</option>
            {(snapshot?.serviceOptions ?? []).map((service) => <option key={service.id} value={service.id}>{service.label}</option>)}
          </select>
        </label>
      </SimpleCreateForm>
    </>
  )
}
