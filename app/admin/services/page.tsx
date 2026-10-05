import { Activity } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/admin-page'
import { ServiceManager } from '@/components/admin/service-manager'
import { getAdminSnapshot, getManagedServices } from '@/lib/data'

export default async function ServicesPage() {
  const [managed, snapshot] = await Promise.all([getManagedServices(), getAdminSnapshot()])
  const portfolio = snapshot?.portfolio ?? []
  const max = Math.max(...portfolio.map((item) => item.count), 1)
  const active = portfolio.reduce((sum, item) => sum + item.count, 0)

  return (
    <>
      <AdminPageHeader
        eyebrow="Delivery management"
        title="Services & projects"
        description="Add, update and remove customer services. A service without its own image uses the homepage image for that division."
      />
      <ServiceManager services={managed?.services ?? []} customers={managed?.customers ?? []} homepageImages={managed?.homepageImages ?? {}} unavailable={managed === null} />
      {portfolio.length > 0 && (
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
                  <div className="h-full bg-brand-gold" style={{ width: `${Math.round((item.count / max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
