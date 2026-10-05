import { Activity } from 'lucide-react'
import { AdminPageHeader, RecordGrid } from '@/components/admin/admin-page'
import { SimpleCreateForm } from '@/components/admin/simple-create-form'
import { createService } from '@/lib/actions'
import { getAdminSnapshot } from '@/lib/data'

const fallback = [
  'MG-SVC-0142 · Residential construction · 65%',
  'MG-SVC-0138 · Corporate event · 80%',
  'MG-SVC-0131 · Talent programme · 42%',
]

export default async function ServicesPage() {
  const snapshot = await getAdminSnapshot()
  const max = Math.max(...(snapshot?.portfolio.map((item) => item.count) ?? [1]), 1)
  const portfolio = snapshot?.portfolio.map((item) => ({ ...item, width: Math.round((item.count / max) * 100) })) ?? [
    { label: 'Construction', count: 24, width: 38 },
    { label: 'Education', count: 14, width: 22 },
    { label: 'Events', count: 11, width: 19 },
    { label: 'Talent development', count: 9, width: 14 },
  ]
  const active = portfolio.reduce((sum, item) => sum + item.count, 0)

  return (
    <>
      <AdminPageHeader
        eyebrow="Delivery management"
        title="Services & projects"
        description="Monitor delivery, balances and deadlines across every business division."
      />
      <RecordGrid rows={snapshot?.services.map((item) => item.label) ?? fallback} />
      <section className="mt-8 border border-brand-line bg-brand-ink p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-light">Portfolio health</p>
            <h2 className="mt-3 font-serif text-3xl">{active} active services</h2>
          </div>
          <Activity className="text-brand-gold" size={20} />
        </div>
        <div className="mt-8 space-y-5">
          {portfolio.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs">
                <span className="text-white/65">{item.label}</span>
                <span>{item.count}</span>
              </div>
              <div className="mt-2 h-1.5 bg-white/15">
                <div className="h-full bg-brand-gold" style={{ width: `${item.width}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
      <SimpleCreateForm
        action={createService}
        submitLabel="Create service"
        fields={[
          { name: 'title', label: 'Service title' },
          { name: 'division', label: 'Division' },
          { name: 'location', label: 'Location' },
          { name: 'contract_value', label: 'Contract value (UGX)', type: 'number' },
        ]}
      >
        <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
          Customer
          <select name="customer_id" required className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink">
            <option value="">Select a customer</option>
            {(snapshot?.customerOptions ?? []).map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
        </label>
      </SimpleCreateForm>
    </>
  )
}
