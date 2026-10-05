'use client'

import { useState } from 'react'
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  Home,
  LayoutDashboard,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Receipt,
  ShieldCheck,
  WalletCards,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandMark, ProgressTimeline, StatusBadge } from '@/components/site/design-system'

const timeline = [
  { label: 'Contract signed', date: '12 May 2026', state: 'complete' as const },
  { label: 'Foundation completed', date: '08 Jun 2026', state: 'complete' as const },
  { label: 'Wall construction', date: '22 Jul 2026', state: 'complete' as const },
  { label: 'Roofing works', date: 'In progress', state: 'current' as const },
  { label: 'Plumbing & electrical', state: 'upcoming' as const },
  { label: 'Finishing & handover', state: 'upcoming' as const },
]

const installments = [
  { name: 'Deposit', amount: 'UGX 10,000,000', due: '10 May 2026', status: 'Paid', tone: 'green' as const },
  { name: 'Second payment', amount: 'UGX 15,000,000', due: '10 Jun 2026', status: 'Paid', tone: 'green' as const },
  { name: 'Third payment', amount: 'UGX 20,000,000', due: '10 Aug 2026', status: 'Paid', tone: 'green' as const },
  { name: 'Final payment', amount: 'UGX 35,000,000', due: '10 Nov 2026', status: 'Due soon', tone: 'gold' as const },
]

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'My services', icon: Home },
  { label: 'Payments', icon: WalletCards },
  { label: 'Documents', icon: FileText },
  { label: 'Notifications', icon: Bell },
]

export default function AccountPage() {
  const [active, setActive] = useState('Overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)

  return (
    <main className="min-h-screen bg-brand-surface text-brand-ink">
      <header className="border-b border-brand-line bg-white">
        <div className="mx-auto flex h-16 min-w-0 max-w-[1440px] items-center justify-between gap-2 px-4 sm:h-20 sm:px-5 md:px-10">
          <BrandMark href="/" />
          <div className="flex items-center gap-4">
            <button aria-label="Notifications" className="relative hidden size-10 items-center justify-center text-brand-muted transition-colors hover:text-brand-ink sm:flex"><Bell size={18} /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-brand-gold-deep" /></button>
            <div className="hidden items-center gap-3 border-l border-brand-line pl-4 sm:flex"><img src="/placeholder-user.jpg" alt="" width={36} height={36} className="size-9 border border-brand-line object-cover" /><div><p className="text-xs font-semibold">John Doe</p><p className="text-[10px] uppercase tracking-wider text-brand-muted">Customer</p></div></div>
            <button aria-label="Open navigation" onClick={() => setMobileOpen(!mobileOpen)} className="flex size-10 items-center justify-center border border-brand-line md:hidden">{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1440px]">
        <aside className={`${mobileOpen ? 'flex' : 'hidden'} absolute inset-x-0 top-16 z-20 flex-col border-b border-brand-line bg-white p-4 sm:top-20 md:relative md:top-0 md:flex md:w-64 md:shrink-0 md:border-b-0 md:border-r md:bg-transparent md:p-8`}>
          <div className="mb-8 border-b border-brand-line pb-7"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted">Customer portal</p><p className="mt-2 font-serif text-2xl">Good morning, John.</p></div>
          <nav className="flex flex-col gap-1">{navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => { setActive(label); setMobileOpen(false) }} className={`flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${active === label ? 'bg-brand-ink font-semibold text-white' : 'text-brand-muted hover:bg-white hover:text-brand-ink'}`}><Icon size={17} />{label}{label === 'Notifications' && <span className="ml-auto flex size-5 items-center justify-center bg-brand-gold text-[10px] font-bold text-brand-ink">2</span>}</button>)}</nav>
          <div className="mt-auto hidden border-t border-brand-line pt-6 md:block"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 text-brand-gold-deep" size={17} /><div><p className="text-xs font-semibold">Secure account</p><p className="mt-1 text-xs leading-5 text-brand-muted">Your information is protected.</p></div></div></div>
        </aside>
        <section className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-12">
          <div className="flex flex-col justify-between gap-5 border-b border-brand-line pb-8 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold-deep">{active}</p><h1 className="mt-2 font-serif text-4xl tracking-[-0.04em] md:text-5xl">Your service overview</h1><p className="mt-3 max-w-xl text-sm leading-6 text-brand-muted">Stay up to date with your projects, payments and the next steps in your Mudogwaluyiira journey.</p></div><Button onClick={() => setPaymentOpen(true)} className="h-12 rounded-none bg-brand-gold px-5 text-xs font-bold uppercase tracking-[0.12em] text-brand-ink hover:bg-brand-gold-light"><CreditCard data-icon="inline-start" /> Pay installment</Button></div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3"><SummaryCard label="Active services" value="01" note="1 project in progress" icon={Home} /><SummaryCard label="Outstanding balance" value="UGX 28M" note="Due 10 November 2026" icon={WalletCards} /><SummaryCard label="Overall progress" value="65%" note="On track for completion" icon={CheckCircle2} /></div>
          <div className="mt-8 grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="border border-brand-line bg-white"><div className="flex items-start justify-between border-b border-brand-line p-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">Active service</p><h2 className="mt-2 font-serif text-2xl">Residential House Construction</h2><p className="mt-1 text-xs text-brand-muted">MG-SVC-2026-0042 · Kampala, Uganda</p></div><StatusBadge tone="green">In progress</StatusBadge></div><div className="grid gap-6 p-6 sm:grid-cols-[1fr_180px]"><div><div className="mb-7 flex items-end justify-between"><div><p className="text-4xl font-serif">65%</p><p className="mt-1 text-xs text-brand-muted">Project completion</p></div><p className="text-right text-xs text-brand-muted">Expected completion<br /><span className="font-semibold text-brand-ink">20 Dec 2026</span></p></div><div className="h-2 bg-brand-surface"><div className="h-full bg-brand-gold-deep" style={{ width: '65%' }} /></div></div><div className="border-l border-brand-line pl-5"><p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Current stage</p><p className="mt-2 text-sm font-semibold">Roofing works</p><p className="mt-1 text-xs leading-5 text-brand-muted">Updated 04 Oct 2026</p></div></div><div className="border-t border-brand-line p-6"><div className="mb-6 flex items-center justify-between"><h3 className="text-sm font-semibold">Service timeline</h3><button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-gold-deep">Full details <ChevronRight size={13} /></button></div><ProgressTimeline steps={timeline} /></div></div>
            <div className="border border-brand-line bg-brand-ink p-6 text-white"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-light">Latest update</p><h2 className="mt-3 font-serif text-2xl">Roofing work has started</h2></div><MessageSquare className="text-brand-gold" size={20} /></div><p className="mt-5 text-sm leading-6 text-white/65">Our team has commenced roofing works. The structure is progressing well and remains on schedule.</p><div className="mt-8 flex items-center justify-between border-t border-white/15 pt-5"><p className="text-xs text-white/50">04 October 2026</p><button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-brand-gold-light">View update <ArrowRight size={14} /></button></div></div>
          </div>
          <div className="mt-8 border border-brand-line bg-white"><div className="flex flex-col justify-between gap-3 border-b border-brand-line p-6 sm:flex-row sm:items-center"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">Payment plan</p><h2 className="mt-2 font-serif text-2xl">Installments</h2></div><div className="text-left sm:text-right"><p className="text-lg font-semibold">UGX 52,000,000 <span className="text-xs font-normal text-brand-muted">paid of UGX 80,000,000</span></p><div className="mt-2 h-1.5 w-44 bg-brand-surface sm:ml-auto"><div className="h-full bg-brand-green" style={{ width: '65%' }} /></div></div></div><div className="divide-y divide-brand-line">{installments.map((item) => <div key={item.name} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="flex size-9 items-center justify-center bg-brand-surface"><Receipt size={16} className="text-brand-gold-deep" /></span><div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-brand-muted">Due {item.due}</p></div></div><div className="flex items-center justify-between gap-4 sm:justify-end"><p className="text-sm font-semibold">{item.amount}</p><StatusBadge tone={item.tone}>{item.status}</StatusBadge>{item.status === 'Due soon' ? <Button onClick={() => setPaymentOpen(true)} size="sm" className="rounded-none bg-brand-ink text-[10px] uppercase tracking-wider hover:bg-brand-ink/90">Pay now</Button> : <button aria-label={`Download receipt for ${item.name}`} className="p-2 text-brand-muted hover:text-brand-ink"><Download size={16} /></button>}</div></div>)}</div></div>
          <div className="mt-8 grid gap-4 md:grid-cols-3"><QuickLink icon={FileText} title="Documents" detail="3 available files" /><QuickLink icon={CalendarDays} title="Next milestone" detail="Roofing completion · 18 Oct" /><QuickLink icon={Bell} title="Notifications" detail="2 unread updates" /></div>
        </section>
      </div>
      {paymentOpen && <PaymentModal onClose={() => setPaymentOpen(false)} />}
    </main>
  )
}

function SummaryCard({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof Home }) { return <div className="border border-brand-line bg-white p-5"><div className="flex items-start justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted">{label}</p><Icon size={17} className="text-brand-gold-deep" /></div><p className="mt-5 font-serif text-3xl">{value}</p><p className="mt-2 text-xs text-brand-muted">{note}</p></div> }
function QuickLink({ icon: Icon, title, detail }: { icon: typeof FileText; title: string; detail: string }) { return <button className="flex items-center gap-4 border border-brand-line bg-white p-5 text-left transition-colors hover:border-brand-gold-deep"><span className="flex size-10 items-center justify-center bg-brand-surface"><Icon size={17} className="text-brand-gold-deep" /></span><span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs text-brand-muted">{detail}</span></span><ChevronRight className="ml-auto text-brand-muted" size={16} /></button> }
function PaymentModal({ onClose }: { onClose: () => void }) { const [method, setMethod] = useState('MTN Mobile Money'); const [submitted, setSubmitted] = useState(false); return <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-ink/50 p-0 sm:items-center sm:p-5"><div className="w-full max-w-lg bg-white p-6 sm:p-8"><div className="flex items-start justify-between border-b border-brand-line pb-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-deep">Secure payment</p><h2 className="mt-2 font-serif text-3xl">Pay final installment</h2></div><button aria-label="Close payment dialog" onClick={onClose} className="text-brand-muted hover:text-brand-ink"><X size={20} /></button></div>{submitted ? <div className="py-10 text-center"><CheckCircle2 className="mx-auto text-brand-green" size={42} /><h3 className="mt-5 font-serif text-2xl">Payment initiated</h3><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-brand-muted">Demo payment request created. In production, this step will connect to the selected provider for server-side verification.</p><Button onClick={onClose} className="mt-7 rounded-none bg-brand-ink text-xs uppercase tracking-wider">Return to portal</Button></div> : <><div className="mt-6 flex items-center justify-between bg-brand-surface p-4"><div><p className="text-xs text-brand-muted">Amount due</p><p className="mt-1 font-serif text-2xl">UGX 35,000,000</p></div><p className="text-right text-xs text-brand-muted">Due<br /><span className="font-semibold text-brand-ink">10 Nov 2026</span></p></div><div className="mt-6"><p className="text-xs font-semibold">Choose payment method</p><div className="mt-3 grid gap-2">{['MTN Mobile Money', 'Airtel Money', 'Visa / Mastercard'].map((item) => <button key={item} onClick={() => setMethod(item)} className={`flex items-center justify-between border p-4 text-left text-sm ${method === item ? 'border-brand-gold-deep bg-brand-gold/10 font-semibold' : 'border-brand-line'}`}><span className="flex items-center gap-3"><CreditCard size={16} className="text-brand-gold-deep" />{item}</span>{method === item && <CheckCircle2 size={16} className="text-brand-green" />}</button>)}</div></div><Button onClick={() => setSubmitted(true)} className="mt-7 h-12 w-full rounded-none bg-brand-gold text-xs font-bold uppercase tracking-[0.14em] text-brand-ink hover:bg-brand-gold-light">Continue securely <ArrowRight data-icon="inline-end" /></Button><p className="mt-4 text-center text-[10px] leading-4 text-brand-muted">Payments are securely verified before your account is updated.</p></>}</div></div> }
