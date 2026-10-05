import Link from 'next/link'
import { SiteChrome } from '@/components/site/site-chrome'

export function PaymentResult({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <SiteChrome>
      <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-5 py-28">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-5xl tracking-[-0.04em]">{title}</h1>
        <p className="mt-5 text-sm leading-6 text-[#65736d]">{text}</p>
        <Link href="/account/payments" className="mt-8 inline-flex h-12 w-fit items-center justify-center bg-[#15251f] px-6 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#263f35]">
          Payments
        </Link>
      </section>
    </SiteChrome>
  )
}
