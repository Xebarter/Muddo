import type { PortalMobilePayment } from '@/lib/data'

export function MobilePaymentList({ rows }: { rows: PortalMobilePayment[] }) {
  if (rows.length === 0) return null

  return (
    <section className="mt-10">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-muted">Mobile Money</p>
      <div className="mt-4 divide-y divide-brand-line border border-brand-line bg-white">
        {rows.map((row) => (
          <div key={row.reference} className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm font-semibold">{row.method}</p>
              <p className="mt-1 text-xs text-brand-muted">{row.date} · {row.reference}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{row.amount}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">{row.status}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
