import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Bell, CalendarDays, CheckCircle2, ChevronRight, FileText, Home, MessageSquare, WalletCards } from 'lucide-react'
import { AccountPageHeader } from '@/components/account/account-page'
import { StatusBadge } from '@/components/site/design-system'
import { getPortal } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Overview | Account | Mudogwaluyiira Group',
}

export default async function AccountOverviewPage() {
  const portal = await getPortal()
  const service = portal?.services[0]
  const due = portal?.installments.find((item) => item.status === 'Due soon' || item.status === 'Due')
  const unread = portal?.notifications.filter((item) => !item.read).length ?? 0
  const nextMilestone = service?.timeline.find((step) => step.state === 'current' || step.state === 'upcoming')

  return (
    <>
      <AccountPageHeader
        eyebrow="Overview"
        title="Your service overview"
        description="Stay up to date with your project, payments and the next step in your Mudogwaluyiira journey."
        action={<Link href="/account/payments" className="inline-flex h-12 items-center justify-center bg-brand-gold px-5 text-xs font-bold uppercase tracking-[0.12em] text-brand-ink hover:bg-brand-gold-light">Pay</Link>}
      />
      {!service ? (
        <p className="mt-8 border border-brand-line bg-white p-6 text-sm text-brand-muted">No service is linked to this account yet. A request from the website is the first step, and the operations team will open the record here.</p>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Summary label="Active services" value={String(portal?.services.length ?? 0).padStart(2, '0')} note={`${portal?.services.length ?? 0} on your account`} icon={Home} />
            <Summary label="Outstanding balance" value={portal?.paymentSummary.outstanding ?? 'UGX 0'} note={due ? `Due ${due.due}` : 'Nothing outstanding'} icon={WalletCards} />
            <Summary label="Overall progress" value={`${service.progress}%`} note={service.stage} icon={CheckCircle2} />
          </div>
          <div className="mt-8 grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
            <article className="border border-brand-line bg-white">
              <div className="flex items-start justify-between gap-4 border-b border-brand-line p-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">Active service</p>
                  <h2 className="mt-2 font-serif text-2xl">{service.title}</h2>
                  <p className="mt-1 text-xs text-brand-muted">{service.reference} · {service.location}</p>
                </div>
                <StatusBadge tone="green">{service.status}</StatusBadge>
              </div>
              <div className="grid gap-6 p-6 sm:grid-cols-[1fr_180px]">
                <div>
                  <div className="mb-7 flex items-end justify-between">
                    <div>
                      <p className="font-serif text-4xl">{service.progress}%</p>
                      <p className="mt-1 text-xs text-brand-muted">Project completion</p>
                    </div>
                    <p className="text-right text-xs text-brand-muted">Expected completion<br /><span className="font-semibold text-brand-ink">{service.completion || 'To be confirmed'}</span></p>
                  </div>
                  <div className="h-2 bg-brand-surface"><div className="h-full bg-brand-gold-deep" style={{ width: `${service.progress}%` }} /></div>
                </div>
                <div className="border-l border-brand-line pl-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Current stage</p>
                  <p className="mt-2 text-sm font-semibold">{service.stage}</p>
                  <p className="mt-1 text-xs leading-5 text-brand-muted">Updated {service.updated}</p>
                </div>
              </div>
              <div className="border-t border-brand-line px-6 py-4">
                <Link href={`/account/services/${service.reference.toLowerCase()}`} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-gold-deep">Full details <ChevronRight size={13} /></Link>
              </div>
            </article>
            <article className="border border-brand-line bg-brand-ink p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-light">Latest update</p>
                  <h2 className="mt-3 font-serif text-2xl">{service.latestUpdate?.title ?? 'No update yet'}</h2>
                </div>
                <MessageSquare className="text-brand-gold" size={20} />
              </div>
              <p className="mt-5 text-sm leading-6 text-white/65">{service.latestUpdate?.body ?? 'Progress notes from the delivery team will appear here.'}</p>
              <div className="mt-8 flex items-center justify-between border-t border-white/15 pt-5">
                <p className="text-xs text-white/50">{service.latestUpdate?.date ?? ''}</p>
                <Link href="/account/notifications" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-brand-gold-light">View update <ArrowRight size={14} /></Link>
              </div>
            </article>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <QuickLink href="/account/documents" icon={FileText} title="Documents" detail={`${portal?.documents.length ?? 0} files on record`} />
            <QuickLink href={`/account/services/${service.reference.toLowerCase()}`} icon={CalendarDays} title="Next milestone" detail={nextMilestone ? `${nextMilestone.label}${nextMilestone.date ? ` · ${nextMilestone.date}` : ''}` : 'Programme to be confirmed'} />
            <QuickLink href="/account/notifications" icon={Bell} title="Notifications" detail={`${unread} unread updates`} />
          </div>
        </>
      )}
    </>
  )
}

function Summary({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof Home }) {
  return (
    <div className="border border-brand-line bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted">{label}</p>
        <Icon size={17} className="text-brand-gold-deep" />
      </div>
      <p className="mt-5 font-serif text-3xl">{value}</p>
      <p className="mt-2 text-xs text-brand-muted">{note}</p>
    </div>
  )
}

function QuickLink({ href, icon: Icon, title, detail }: { href: string; icon: typeof FileText; title: string; detail: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 border border-brand-line bg-white p-5 text-left transition-colors hover:border-brand-gold-deep">
      <span className="flex size-10 items-center justify-center bg-brand-surface"><Icon size={17} className="text-brand-gold-deep" /></span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1 block text-xs text-brand-muted">{detail}</span>
      </span>
      <ChevronRight className="ml-auto text-brand-muted" size={16} />
    </Link>
  )
}
