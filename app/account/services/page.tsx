import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { AccountPageHeader } from '@/components/account/account-page'
import { StatusBadge } from '@/components/site/design-system'
import { getPortal } from '@/lib/data'

export const metadata: Metadata = {
  title: 'My services | Account | Mudogwaluyiira Group',
}

export default async function ServicesPage() {
  const portal = await getPortal()
  const services = portal?.services ?? []

  return (
    <>
      <AccountPageHeader
        eyebrow="My services"
        title="Services in your name"
        description="Follow the work underway and open a service for its programme, stage and expected completion."
      />
      {services.length === 0 ? (
        <p className="mt-8 border border-brand-line bg-white p-6 text-sm text-brand-muted">No services are on this account yet.</p>
      ) : (
        <div className="mt-8 grid gap-4">
          {services.map((service) => (
            <Link key={service.reference} href={`/account/services/${service.reference.toLowerCase()}`} className="border border-brand-line bg-white p-6 transition-colors hover:border-brand-gold-deep">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-deep">{service.division}</p>
                  <h2 className="mt-2 font-serif text-2xl">{service.title}</h2>
                  <p className="mt-2 text-xs text-brand-muted">{service.reference} · {service.location}</p>
                </div>
                <StatusBadge tone="green">{service.status}</StatusBadge>
              </div>
              <div className="mt-6">
                <div className="flex items-end justify-between text-xs text-brand-muted">
                  <span>{service.stage}</span>
                  <span>{service.progress}%</span>
                </div>
                <div className="mt-2 h-1.5 bg-brand-surface"><div className="h-full bg-brand-gold-deep" style={{ width: `${service.progress}%` }} /></div>
              </div>
              <p className="mt-5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-gold-deep">Open service <ChevronRight size={13} /></p>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
