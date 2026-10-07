import Link from 'next/link'
import { PublicSite } from '@/components/site/public-site'

export function PaymentResult({ eyebrow, title, text, receiptHref }: { eyebrow: string; title: string; text: string; receiptHref?: string }) {
  return (
    <PublicSite>
      <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-5 py-28">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-5xl tracking-[-0.04em]">{title}</h1>
        <p className="mt-5 text-sm leading-6 text-[#65736d]">{text}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {receiptHref && (
            <a href={receiptHref} className="inline-flex h-12 items-center justify-center bg-[#c9a45c] px-6 text-xs font-bold uppercase tracking-[0.14em] text-[#15251f] hover:bg-[#d9bb7d]">
              Download receipt
            </a>
          )}
          <Link href="/account/payments" className="inline-flex h-12 items-center justify-center bg-[#15251f] px-6 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#263f35]">
            Payments
          </Link>
        </div>
      </section>
    </PublicSite>
  )
}
