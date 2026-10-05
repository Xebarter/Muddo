import type { ReactNode } from 'react'
import { ChevronRight, ClipboardList } from 'lucide-react'

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col justify-between gap-5 border-b border-brand-line pb-8 sm:flex-row sm:items-end">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold-deep">{eyebrow}</p>
        <h1 className="mt-2 font-serif text-4xl tracking-[-0.04em] md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-brand-muted">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function AdminAction({ children }: { children: ReactNode }) {
  return (
    <button className="flex h-12 items-center justify-center gap-2 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90">
      <ClipboardList size={16} />
      {children}
    </button>
  )
}

export function RecordGrid({ rows }: { rows: string[] }) {
  return (
    <section className="mt-8 border border-brand-line bg-white">
      <div className="grid gap-px bg-brand-line sm:grid-cols-3">
        {rows.map((row, index) => (
          <div key={row} className="bg-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">0{index + 1}</p>
            <p className="mt-4 text-sm font-semibold leading-6">{row}</p>
            <button className="mt-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-gold-deep">
              Open record <ChevronRight size={13} />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
