import { Suspense } from 'react'
import { BrandMark } from '@/components/site/design-system'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-brand-surface text-brand-ink lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden bg-brand-ink text-white lg:flex">
        <img src="/mudogwaluyiira-hero.png" alt="" className="absolute inset-0 size-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#15251f] via-[#15251f]/75 to-[#15251f]/35" />
        <div className="relative flex w-full flex-col justify-between p-12 xl:p-16">
          <BrandMark href="/" />
          <div className="max-w-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-gold-light">Customer and admin access</p>
            <h2 className="mt-4 font-serif text-5xl leading-[1.02] tracking-[-0.04em]">Your services, payments and documents, kept together.</h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/70">Sign in with the phone number on your account. Email and Google remain available when you need them.</p>
          </div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Kampala, Uganda</p>
        </div>
      </aside>
      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[420px]">
          <BrandMark href="/" className="lg:hidden" />
          <p className="mt-10 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold-deep lg:mt-0">Sign in</p>
          <h1 className="mt-2 font-serif text-4xl tracking-[-0.04em]">Welcome back</h1>
          <p className="mt-3 text-sm leading-6 text-brand-muted">Use your phone number to continue. We will send a one-time code.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
