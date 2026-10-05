import type { ReactNode } from 'react'

export function AccountPageHeader({
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
    <div className="flex flex-col gap-4 border-b border-brand-line pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold-deep">{eyebrow}</p>
        <h1 className="mt-2 font-serif text-[2.15rem] leading-[1.05] tracking-[-0.04em] sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-brand-muted">{description}</p>
      </div>
      {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
    </div>
  )
}
