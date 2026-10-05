import type { Metadata } from 'next'
import Link from 'next/link'
import { Bell, CalendarDays, ChevronRight, FileText } from 'lucide-react'
import { AccountPageHeader } from '@/components/account/account-page'
import { getPortal, type PortalData } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Overview | Account | Mudogwaluyiira Group',
}

export default async function AccountOverviewPage() {
  return <AccountOverview portal={await getPortal()} />
}

function AccountOverview({ portal }: { portal: PortalData | null }) {
  const service = portal?.services[0]
  const due = portal?.installments.find((item) => item.status === 'Due soon' || item.status === 'Due')
  const unread = portal?.notifications.filter((item) => !item.read).length ?? 0
  const nextMilestone = service?.timeline.find((step) => step.state === 'current' || step.state === 'upcoming')
  const firstName = portal?.profile.name.split(' ')[0] || 'there'
  const moreServices = Math.max((portal?.services.length ?? 0) - 1, 0)

  return (
    <>
      <AccountPageHeader
        eyebrow="Overview"
        title={`Hello, ${firstName}.`}
        description="Services, payments and the next step on your account."
        action={service ? (
          <Link href="/account/payments" className="flex h-12 w-full items-center justify-center bg-brand-gold px-6 text-xs font-bold uppercase tracking-[0.14em] text-brand-ink hover:bg-brand-gold-light sm:w-auto">
            Pay
          </Link>
        ) : undefined}
      />
      {!service ? (
        <section className="mt-6 border border-brand-line bg-white p-6 sm:mt-8 sm:p-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-deep">No service yet</p>
          <h2 className="mt-3 max-w-md font-serif text-3xl leading-tight tracking-[-0.03em] sm:text-4xl">Your record will open here.</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-brand-muted">Request a service. The team will link the work, payments and documents to this account.</p>
          <Link href="/contact" className="mt-6 flex h-12 w-full items-center justify-center bg-brand-ink text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-brand-ink/90 sm:w-fit sm:px-6">
            Request a service
          </Link>
        </section>
      ) : (
        <>
          <article className="mt-6 border border-brand-ink bg-brand-ink text-white sm:mt-8">
            <div className="flex items-start justify-between gap-4 p-5 sm:p-7">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-light">Active service</p>
                <h2 className="mt-2 font-serif text-[1.65rem] leading-tight tracking-[-0.03em] sm:text-3xl">{service.title}</h2>
                <p className="mt-2 text-xs text-white/55">{service.reference} · {service.location}</p>
              </div>
              <span className="shrink-0 border border-white/15 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-gold-light">{service.status}</span>
            </div>
            <div className="px-5 sm:px-7">
              <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
                <p className="font-serif text-5xl leading-none tracking-[-0.04em]">{service.progress}<span className="text-2xl text-brand-gold-light">%</span></p>
                <p className="max-w-[11rem] text-right text-xs leading-5 text-white/55">
                  Expected completion
                  <span className="mt-1 block font-semibold text-white">{service.completion || 'To be confirmed'}</span>
                </p>
              </div>
              <div className="mt-4 h-1.5 bg-white/10">
                <div className="h-full bg-brand-gold" style={{ width: `${Math.min(100, Math.max(0, service.progress))}%` }} />
              </div>
              <div className="mt-5 flex flex-col gap-1 border-t border-white/10 py-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Current stage</p>
                  <p className="mt-1 text-sm font-semibold">{service.stage}</p>
                </div>
                <p className="text-xs text-white/45">Updated {service.updated}</p>
              </div>
            </div>
            <div className="flex flex-col border-t border-white/10 sm:flex-row">
              <Link href={`/account/services/${service.reference.toLowerCase()}`} className="flex min-h-12 flex-1 items-center justify-between px-5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-gold-light sm:px-7">
                Full details <ChevronRight size={14} />
              </Link>
              {moreServices > 0 && (
                <Link href="/account/services" className="flex min-h-12 flex-1 items-center justify-between border-t border-white/10 px-5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70 sm:border-t-0 sm:border-l sm:px-7">
                  {moreServices} more {moreServices === 1 ? 'service' : 'services'} <ChevronRight size={14} />
                </Link>
              )}
            </div>
          </article>

          <div className="mt-3 grid grid-cols-2 border border-brand-line bg-white sm:mt-4 sm:grid-cols-3">
            <Figure className="col-span-2 border-b sm:col-span-1 sm:border-r sm:border-b-0" label="Outstanding" value={portal?.paymentSummary.outstanding ?? 'UGX 0'} note={due ? `Due ${due.due}` : 'Nothing due'} />
            <Figure className="border-r" label="Services" value={String(portal?.services.length ?? 0).padStart(2, '0')} note="On this account" />
            <Figure label="Progress" value={`${service.progress}%`} note={service.stage} />
          </div>

          <article className="mt-3 border border-brand-line bg-white p-5 sm:mt-4 sm:p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-deep">Latest update</p>
            <h2 className="mt-2 font-serif text-2xl leading-tight tracking-[-0.03em]">{service.latestUpdate?.title ?? 'No update yet'}</h2>
            <p className="mt-3 text-sm leading-6 text-brand-muted">{service.latestUpdate?.body ?? 'Progress notes from the delivery team will appear here.'}</p>
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-brand-line pt-4">
              <p className="text-xs text-brand-muted">{service.latestUpdate?.date ?? 'Waiting on the team'}</p>
              <Link href="/account/notifications" className="inline-flex min-h-11 items-center text-[10px] font-bold uppercase tracking-[0.14em] text-brand-gold-deep">
                View update
              </Link>
            </div>
          </article>

          <nav className="mt-3 border border-brand-line bg-white sm:mt-4" aria-label="Account shortcuts">
            <Shortcut href="/account/documents" icon={FileText} title="Documents" detail={`${portal?.documents.length ?? 0} files on record`} />
            <Shortcut href={`/account/services/${service.reference.toLowerCase()}`} icon={CalendarDays} title="Next milestone" detail={nextMilestone ? `${nextMilestone.label}${nextMilestone.date ? ` · ${nextMilestone.date}` : ''}` : 'Programme to be confirmed'} />
            <Shortcut href="/account/notifications" icon={Bell} title="Notifications" detail={unread === 1 ? '1 unread update' : `${unread} unread updates`} />
          </nav>
        </>
      )}
    </>
  )
}

function Figure({ label, value, note, className = '' }: { label: string; value: string; note: string; className?: string }) {
  return (
    <div className={`min-w-0 p-5 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted">{label}</p>
      <p className="mt-3 font-serif text-2xl leading-none tracking-[-0.03em] break-words sm:text-3xl">{value}</p>
      <p className="mt-2 text-xs leading-5 text-brand-muted">{note}</p>
    </div>
  )
}

function Shortcut({ href, icon: Icon, title, detail }: { href: string; icon: typeof FileText; title: string; detail: string }) {
  return (
    <Link href={href} className="flex min-h-[4.5rem] items-center gap-4 border-b border-brand-line px-4 py-3 transition-colors last:border-b-0 hover:bg-brand-surface sm:px-5">
      <span className="flex size-10 shrink-0 items-center justify-center bg-brand-surface"><Icon size={17} className="text-brand-gold-deep" /></span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-brand-muted">{detail}</span>
      </span>
      <ChevronRight className="ml-auto shrink-0 text-brand-muted" size={16} />
    </Link>
  )
}
