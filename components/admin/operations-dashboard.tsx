'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Search,
  Users,
  WalletCards,
} from 'lucide-react'
import { StatusBadge } from '@/components/site/design-system'
import { AdminPageHeader } from '@/components/admin/admin-page'

type RequestRow = { name: string; service: string; location: string; date: string; status: string; tone: 'gold' | 'green' | 'muted' }
type PaymentRow = { customer: string; service: string; amount: string; date: string; status: string }

export function OperationsDashboard({
  requests,
  payments,
  portfolio,
  metrics,
}: {
  requests: RequestRow[]
  payments: PaymentRow[]
  portfolio: { label: string; count: number; width: number }[]
  metrics: { customers: string; activeServices: string; revenue: string; outstanding: string; divisions: string; dueMilestones: string; documentsToReview: string; completed: string }
}) {
  const [query, setQuery] = useState('')
  const visiblePayments = payments.filter((item) => `${item.customer} ${item.service}`.toLowerCase().includes(query.toLowerCase()))
  const activeCount = portfolio.reduce((sum, item) => sum + item.count, 0)

  return (
    <>
      <AdminPageHeader
        eyebrow="Dashboard"
        title="Operations overview"
        description="A clear view of customers, services, payments and the work moving the group forward."
        action={<Link href="/admin/services" className="inline-flex h-12 items-center justify-center bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90">New service</Link>}
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total customers" value={metrics.customers} note="On the customer directory" icon={Users} />
        <Metric label="Active services" value={metrics.activeServices} note={`Across ${metrics.divisions} divisions`} icon={Building2} />
        <Metric label="Revenue received" value={metrics.revenue} note="Settled installments" icon={CircleDollarSign} />
        <Metric label="Outstanding" value={metrics.outstanding} note="Still to be collected" icon={WalletCards} />
      </div>
      <div className="mt-8 grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="border border-brand-line bg-white">
          <div className="flex items-center justify-between border-b border-brand-line p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">Incoming work</p>
              <h2 className="mt-2 font-serif text-2xl">Service requests</h2>
            </div>
            <Link href="/admin/service-requests" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-gold-deep">
              View all <ChevronRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-brand-line">
            {requests.slice(0, 4).map((request) => (
              <div key={`${request.name}-${request.date}`} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex size-10 items-center justify-center bg-brand-surface text-sm font-semibold">{request.name.split(' ').map((part) => part[0]).join('')}</span>
                  <div>
                    <p className="text-sm font-semibold">{request.name}</p>
                    <p className="mt-1 text-xs text-brand-muted">{request.service} · {request.location}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <p className="text-xs text-brand-muted">{request.date}</p>
                  <StatusBadge tone={request.tone}>{request.status}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="border border-brand-line bg-brand-ink p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-light">Portfolio health</p>
              <h2 className="mt-3 font-serif text-3xl">{activeCount} active<br />services</h2>
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
          <Link href="/admin/services" className="mt-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-brand-gold-light">
            Explore services <ChevronRight size={13} />
          </Link>
        </section>
      </div>
      <section className="mt-8 border border-brand-line bg-white">
        <div className="flex flex-col gap-4 border-b border-brand-line p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">Finance</p>
            <h2 className="mt-2 font-serif text-2xl">Recent payments</h2>
          </div>
          <label className="flex h-10 items-center gap-2 border border-brand-line px-3 text-brand-muted">
            <Search size={16} />
            <span className="sr-only">Search payments</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search payments" className="w-36 bg-transparent text-xs text-brand-ink outline-none placeholder:text-brand-muted" />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-brand-surface text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {visiblePayments.map((payment) => (
                <tr key={`${payment.customer}-${payment.amount}-${payment.date}`} className="text-sm">
                  <td className="px-6 py-4 font-semibold">{payment.customer}</td>
                  <td className="px-6 py-4 text-brand-muted">{payment.service}</td>
                  <td className="px-6 py-4 font-semibold">{payment.amount}</td>
                  <td className="px-6 py-4 text-xs text-brand-muted">{payment.date}</td>
                  <td className="px-6 py-4"><StatusBadge tone={payment.status === 'Successful' ? 'green' : 'gold'}>{payment.status}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <QuickAction href="/admin/progress" icon={CalendarDays} title="Upcoming milestones" detail={`${metrics.dueMilestones} services in progress`} />
        <QuickAction href="/admin/documents" icon={FileText} title="Documents to review" detail={`${metrics.documentsToReview} awaiting approval`} />
        <QuickAction href="/admin/services" icon={CheckCircle2} title="Completed projects" detail={`${metrics.completed} completed services`} />
      </div>
    </>
  )
}

function Metric({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof Users }) {
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

function QuickAction({ href, icon: Icon, title, detail }: { href: string; icon: typeof CalendarDays; title: string; detail: string }) {
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
