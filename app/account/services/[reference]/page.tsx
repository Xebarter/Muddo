import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AccountPageHeader } from '@/components/account/account-page'
import { ProgressTimeline, StatusBadge } from '@/components/site/design-system'
import { getPortal } from '@/lib/data'

type Props = { params: Promise<{ reference: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { reference } = await params
  const portal = await getPortal()
  const service = portal?.services.find((item) => item.reference.toLowerCase() === reference)
  if (!service) return { title: 'Service | Account' }
  return { title: `${service.title} | Account | Mudogwaluyiira Group` }
}

export default async function ServiceDetailPage({ params }: Props) {
  const { reference } = await params
  const portal = await getPortal()
  const service = portal?.services.find((item) => item.reference.toLowerCase() === reference)
  if (!service) notFound()

  return (
    <>
      <AccountPageHeader
        eyebrow={service.reference}
        title={service.title}
        description={`${service.division} in ${service.location}. Expected completion ${service.completion || 'to be confirmed'}.`}
        action={<StatusBadge tone="green">{service.status}</StatusBadge>}
      />
      <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="border border-brand-line bg-white p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">Progress</p>
          <p className="mt-4 font-serif text-5xl">{service.progress}%</p>
          <div className="mt-5 h-2 bg-brand-surface"><div className="h-full bg-brand-gold-deep" style={{ width: `${service.progress}%` }} /></div>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between gap-4 border-t border-brand-line pt-4"><dt className="text-brand-muted">Current stage</dt><dd className="font-semibold">{service.stage}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-brand-muted">Last update</dt><dd className="font-semibold">{service.updated}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-brand-muted">Completion</dt><dd className="font-semibold">{service.completion || 'To be confirmed'}</dd></div>
          </dl>
          <div className="mt-6 flex flex-col gap-3 text-[10px] font-bold uppercase tracking-wider">
            <Link href="/account/payments" className="text-brand-gold-deep">View payment plan</Link>
            <Link href="/account/documents" className="text-brand-gold-deep">View documents</Link>
          </div>
        </section>
        <section className="border border-brand-line bg-white p-6">
          <h2 className="text-sm font-semibold">Service timeline</h2>
          <div className="mt-6"><ProgressTimeline steps={service.timeline} /></div>
        </section>
      </div>
    </>
  )
}
