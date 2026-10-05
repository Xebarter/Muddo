import { Activity } from 'lucide-react'
import { AdminAction, AdminPageHeader, RecordGrid } from '@/components/admin/admin-page'

const services = [
  'MG-SVC-0142 · Residential construction · 65%',
  'MG-SVC-0138 · Corporate event · 80%',
  'MG-SVC-0131 · Talent programme · 42%',
]

const portfolio = [
  ['Construction', 38, '24'],
  ['Education', 22, '14'],
  ['Events', 19, '11'],
  ['Talent development', 14, '9'],
] as const

export default function ServicesPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Delivery management"
        title="Services & projects"
        description="Monitor delivery, balances and deadlines across every business division."
        action={<AdminAction>Create service</AdminAction>}
      />
      <RecordGrid rows={services} />
      <section className="mt-8 border border-brand-line bg-brand-ink p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-light">Portfolio health</p>
            <h2 className="mt-3 font-serif text-3xl">67 active services</h2>
          </div>
          <Activity className="text-brand-gold" size={20} />
        </div>
        <div className="mt-8 space-y-5">
          {portfolio.map(([label, width, count]) => (
            <div key={label}>
              <div className="flex justify-between text-xs">
                <span className="text-white/65">{label}</span>
                <span>{count}</span>
              </div>
              <div className="mt-2 h-1.5 bg-white/15">
                <div className="h-full bg-brand-gold" style={{ width: `${width}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
