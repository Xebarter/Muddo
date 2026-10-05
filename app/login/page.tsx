import { Suspense } from 'react'
import { BrandMark } from '@/components/site/design-system'
import { LoginForm } from '@/components/auth/login-form'
import { getSiteContact } from '@/lib/data'

export default async function LoginPage() {
  const contact = await getSiteContact()
  return (
    <main className="min-h-dvh bg-[#f3f1ec] text-brand-ink lg:grid lg:min-h-screen lg:grid-cols-[1.05fr_0.95fr] lg:bg-brand-surface">
      <aside className="relative overflow-hidden bg-[#15251f] text-white lg:hidden">
        <img src="/mudogwaluyiira-hero.png" alt="" className="absolute inset-0 size-full object-cover object-[72%_center] opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#15251f]/25 via-[#15251f]/72 to-[#15251f]" />
        <div className="relative px-5 pb-14 pt-[max(1.15rem,env(safe-area-inset-top))]">
          <BrandMark href="/" className="text-white" />
          <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.22em] text-[#d9bb7d]">Customer and admin access</p>
          <h1 className="mt-3 font-serif text-[2.05rem] leading-[1.05] tracking-[-0.04em]">Welcome back.</h1>
          <p className="mt-3 text-sm leading-6 text-white/72">Payments, services and documents.</p>
        </div>
      </aside>

      <aside className="relative hidden overflow-hidden bg-brand-ink text-white lg:flex">
        <img src="/mudogwaluyiira-hero.png" alt="" className="absolute inset-0 size-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#15251f] via-[#15251f]/75 to-[#15251f]/35" />
        <div className="relative flex w-full flex-col justify-between p-12 xl:p-16">
          <BrandMark href="/" />
          <div className="max-w-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-gold-light">Customer and admin access</p>
            <h2 className="mt-4 font-serif text-5xl leading-[1.02] tracking-[-0.04em]">Your services, payments and documents, kept together.</h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/70">Sign in with your email and password. Google is available if you prefer it.</p>
          </div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{contact.address}</p>
        </div>
      </aside>

      <section className="relative z-10 -mt-8 flex flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 lg:mt-0 lg:items-center lg:justify-center lg:px-8 lg:py-12">
        <div className="login-sheet mx-auto w-full max-w-[440px] border-t-2 border-[#c9a45c] bg-white px-5 py-6 shadow-[0_22px_50px_rgba(16,28,23,0.12)] sm:px-7 sm:py-8 lg:max-w-[420px] lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          <p className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold-deep lg:block">Sign in</p>
          <h1 className="hidden font-serif text-4xl tracking-[-0.04em] lg:mt-2 lg:block">Welcome back</h1>
          <p className="mt-3 hidden text-sm leading-6 text-brand-muted lg:block">Use the email and password for your Mudogwaluyiira account.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
          <p className="mt-8 text-center text-[11px] uppercase tracking-[0.16em] text-brand-muted lg:hidden">{contact.address}</p>
        </div>
      </section>
    </main>
  )
}
