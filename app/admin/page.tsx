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
  MoreHorizontal,
  Search,
  Users,
  WalletCards,
} from 'lucide-react'
import { StatusBadge } from '@/components/site/design-system'
import { AdminAction, AdminPageHeader } from '@/components/admin/admin-page'

const requests = [
  { name: 'Sarah Nakato', service: 'House construction', location: 'Kampala', date: 'Today, 09:42', status: 'New', tone: 'gold' as const },
  { name: 'Kato & Sons Ltd', service: 'Corporate event', location: 'Entebbe', date: 'Yesterday', status: 'Reviewing', tone: 'muted' as const },
  { name: 'Grace Achieng', service: 'Talent development', location: 'Jinja', date: '06 Oct 2026', status: 'New', tone: 'gold' as const },
  { name: 'Mirembe Schools', service: 'Education development', location: 'Mukono', date: '05 Oct 2026', status: 'Contacted', tone: 'green' as const },
]

const payments = [
  { customer: 'John Doe', service: 'Residential construction', amount: 'UGX 20,000,000', date: '04 Oct 2026', status: 'Successful' },
  { customer: 'Mariam Namusoke', service: 'Event management', amount: 'UGX 8,500,000', date: '03 Oct 2026', status: 'Successful' },
  { customer: 'David Ouma', service: 'Talent programme', amount: 'UGX 1,200,000', date: '02 Oct 2026', status: 'Pending' },
]

export default function DashboardPage() {
  const [query, setQuery] = useState('')
  const visiblePayments = payments.filter((item) => `${item.customer} ${item.service}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <AdminPageHeader
        eyebrow="Dashboard"
        title="Operations overview"
        description="A clear view of customers, services, payments and the work moving the group forward."
        action={<AdminAction>New service</AdminAction>}
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total customers" value="248" note="12 added this month" icon={Users} />
        <Metric label="Active services" value="67" note="Across 5 divisions" icon={Building2} />
        <Metric label="Revenue received" value="UGX 184.6M" note="+14.8% this quarter" icon={CircleDollarSign} />
        <Metric label="Outstanding" value="UGX 72.4M" note="31 installment plans" icon={WalletCards} />
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
            {requests.map((request) => (
              <div key={request.name} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
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
                  <button aria-label={`More options for ${request.name}`} className="text-brand-muted hover:text-brand-ink"><MoreHorizontal size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="border border-brand-line bg-brand-ink p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-light">Portfolio health</p>
              <h2 className="mt-3 font-serif text-3xl">67 active<br />services</h2>
            </div>
            <Activity className="text-brand-gold" size={20} />
          </div>
          <div className="mt-8 space-y-5">
            {[['Construction', 38, '24'], ['Education', 22, '14'], ['Events', 19, '11'], ['Talent development', 14, '9']].map(([label, width, count]) => (
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
                <tr key={payment.customer} className="text-sm">
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
        <QuickAction href="/admin/progress" icon={CalendarDays} title="Upcoming milestones" detail="12 due this week" />
        <QuickAction href="/admin/documents" icon={FileText} title="Documents to review" detail="6 awaiting approval" />
        <QuickAction href="/admin/services" icon={CheckCircle2} title="Completed projects" detail="18 this financial year" />
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
