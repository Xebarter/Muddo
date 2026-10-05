import { receiptHref } from '@/lib/save-receipt'

export type AccountReceipt = {
  reference: string
  title: string
  amount: string
  date: string
  method: string
}

export function ReceiptList({ receipts }: { receipts: AccountReceipt[] }) {
  return (
    <section className="mt-10 max-w-2xl border border-brand-line bg-white">
      <div className="border-b border-brand-line px-6 py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">Receipts</p>
        <h2 className="mt-2 font-serif text-2xl tracking-[-0.03em]">Confirmed payments</h2>
        <p className="mt-2 text-sm leading-6 text-brand-muted">Download a receipt again whenever you are signed in.</p>
      </div>
      {receipts.length === 0 ? (
        <p className="px-6 py-12 text-sm leading-6 text-brand-muted">Receipts appear here after a payment is confirmed.</p>
      ) : (
        <ol>
          {receipts.map((item) => (
            <li key={item.reference} className="flex flex-col gap-3 border-b border-brand-line px-6 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-serif text-xl leading-tight">{item.title}</p>
                <p className="mt-1 text-sm text-brand-muted">{item.date} · {item.method}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-muted">{item.reference}</p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <p className="text-sm font-semibold tabular-nums">{item.amount}</p>
                <a href={receiptHref(item.reference)} className="inline-flex h-11 items-center justify-center bg-brand-ink px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white hover:bg-brand-ink/90">Download</a>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
