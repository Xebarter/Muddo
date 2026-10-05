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
