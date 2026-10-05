'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { StatusBadge } from '@/components/site/design-system'

export function PaymentLedger({ payments }: { payments: { customer: string; service: string; amount: string; date: string; status: string }[] }) {
  const [query, setQuery] = useState('')
  const visiblePayments = payments.filter((item) => `${item.customer} ${item.service}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <section className="mt-8 border border-brand-line bg-white">
      <div className="flex flex-col gap-4 border-b border-brand-line p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">Finance</p>
          <h2 className="mt-2 font-serif text-2xl">Payments</h2>
        </div>
        <label className="flex h-10 items-center gap-2 border border-brand-line px-3 text-brand-muted">
          <Search size={16} />
          <span className="sr-only">Search</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" aria-label="Search" className="w-36 bg-transparent text-xs text-brand-ink outline-none placeholder:text-brand-muted" />
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
  )
}
