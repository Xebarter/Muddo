'use client'

import type { ReactNode } from 'react'
import { ArrowRight, CheckCircle2, Clock3, FileText, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const logoSrc = '/web-app-manifest-512x512.png'

export function BrandMark({
  compact = false,
  href,
  size = 'md',
  className = '',
}: {
  compact?: boolean
  href?: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const markSize = size === 'sm' ? 'size-9 sm:size-10' : 'size-9 sm:size-12'
  const nameSize = size === 'sm'
    ? 'text-[0.8rem] tracking-[0.03em] sm:text-sm sm:tracking-[0.04em]'
    : 'text-[clamp(0.72rem,3.15vw,1.05rem)] tracking-[0.02em] sm:text-2xl sm:tracking-[0.06em]'
  const subtitleSize = size === 'sm'
    ? 'text-[8px] tracking-[0.12em] sm:text-[9px] sm:tracking-[0.16em]'
    : 'text-[clamp(7px,1.85vw,10px)] tracking-[0.12em] sm:text-[11px] sm:tracking-[0.2em]'
  const content = (
    <>
      <img
        src={logoSrc}
        alt={href ? '' : 'Mudogwaluyiira Group logo'}
        width={512}
        height={512}
        className={`${markSize} shrink-0 object-contain`}
      />
      {!compact && (
        <span className="flex min-w-0 flex-col">
          <span className={`truncate font-serif font-semibold uppercase leading-none ${nameSize}`}>Mudogwaluyiira</span>
          <span className={`mt-1 truncate font-semibold uppercase leading-none opacity-80 sm:mt-1.5 ${subtitleSize}`}>Group of Companies</span>
        </span>
      )}
    </>
  )
  const classes = `flex min-w-0 items-center gap-2 text-current sm:gap-3 ${className}`.trim()

  if (href) {
    return (
      <a href={href} className={classes} aria-label="Mudogwaluyiira Group home">
        {content}
      </a>
    )
  }

  return <div className={classes}>{content}</div>
}

export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${dark ? 'text-brand-gold-light' : 'text-brand-gold-deep'}`}>{children}</p>
}

export function SectionHeading({ title, accent, dark = false }: { title: string; accent?: string; dark?: boolean }) {
  return <div><Eyebrow dark={dark}>Mudogwaluyiira Group</Eyebrow><h2 className={`mt-3 font-serif text-4xl leading-[1.02] tracking-[-0.035em] md:text-6xl ${dark ? 'text-white' : 'text-brand-ink'}`}>{title}{accent && <><br /><span className="text-brand-gold-deep">{accent}</span></>}</h2></div>
}

export function StatBlock({ value, label }: { value: string; label: string }) {
  return <div className="border-l border-brand-line px-5 first:border-l-0 first:pl-0"><p className="font-serif text-3xl text-brand-ink md:text-4xl">{value}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">{label}</p></div>
}

export function StatusBadge({ children, tone = 'gold' }: { children: ReactNode; tone?: 'gold' | 'green' | 'muted' }) {
  const toneClass = { gold: 'bg-brand-gold/20 text-brand-gold-deep', green: 'bg-brand-green/10 text-brand-green', muted: 'bg-brand-surface text-brand-muted' }[tone]
  return <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] ${toneClass}`}><span className="size-1.5 rounded-full bg-current" />{children}</span>
}

export function ProgressTimeline({ steps }: { steps: { label: string; date?: string; state: 'complete' | 'current' | 'upcoming' }[] }) {
  return <ol className="flex flex-col gap-0">{steps.map((step, index) => <li key={step.label} className="relative flex gap-4 pb-7 last:pb-0"><div className="flex flex-col items-center">{step.state === 'complete' ? <CheckCircle2 className="relative z-10 text-brand-green" /> : step.state === 'current' ? <Clock3 className="relative z-10 text-brand-gold-deep" /> : <span className="relative z-10 mt-1 size-3 rounded-full border-2 border-brand-line bg-white" />}{index < steps.length - 1 && <span className="absolute top-6 h-full w-px bg-brand-line" />}</div><div><p className={`text-sm font-semibold ${step.state === 'upcoming' ? 'text-brand-muted' : 'text-brand-ink'}`}>{step.label}</p>{step.date && <p className="mt-1 text-xs text-brand-muted">{step.date}</p>}</div></li>)}</ol>
}

export function ServiceCard({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <article className="group border border-brand-line bg-white p-7 transition-colors hover:border-brand-gold-deep hover:bg-brand-surface"><div className="flex items-start justify-between"><ShieldCheck className="text-brand-gold-deep" strokeWidth={1.5} /><FileText className="text-brand-line" /></div><h3 className="mt-12 font-serif text-2xl text-brand-ink">{title}</h3><p className="mt-3 text-sm leading-6 text-brand-muted">{description}</p>{children ?? <Button variant="ghost" className="mt-5 -ml-3 rounded-none px-3 text-[10px] font-bold uppercase tracking-[0.16em]">Explore service <ArrowRight data-icon="inline-end" /></Button>}</article>
}

export const designSystemTokens = { ink: '#15251f', gold: '#c9a45c', surface: '#f7f7f5', muted: '#65736d', line: '#d9ddd8' } as const

export default function DesignSystemPreview() {
  return <main className="min-h-screen bg-brand-surface p-8 text-brand-ink"><div className="mx-auto max-w-6xl"><BrandMark /><div className="mt-16 grid gap-12 lg:grid-cols-[1fr_1.2fr]"><div><SectionHeading title="A shared visual language." accent="Built for trust." /><p className="mt-6 max-w-lg text-sm leading-7 text-brand-muted">Reusable components, tokens and patterns for the corporate website, customer portal and admin workspace.</p></div><div className="grid gap-5 sm:grid-cols-2"><ServiceCard title="Construction" description="Trusted delivery across Uganda." /><ServiceCard title="Education" description="Developing brighter futures." /></div></div><div className="mt-16 grid grid-cols-2 gap-4 border-y border-brand-line py-8 md:grid-cols-4"><StatBlock value="120+" label="Projects completed" /><StatBlock value="4,800+" label="People reached" /><StatBlock value="12" label="Years experience" /><StatBlock value="05" label="Business divisions" /></div><div className="mt-16 max-w-md"><StatusBadge tone="green">Service active</StatusBadge><div className="mt-8"><ProgressTimeline steps={[{ label: 'Contract signed', date: '12 May 2026', state: 'complete' }, { label: 'Wall construction', date: 'In progress', state: 'current' }, { label: 'Roofing', state: 'upcoming' }]} /></div></div></div></main>
}

export type DesignSystemComponent = typeof DesignSystemPreview
export { DesignSystemPreview }
export { BrandMark as Logo }
