import { ArrowRight, MoveUpRight } from 'lucide-react'
import { PublicSite } from '@/components/site/public-site'
import { RequestServiceButton } from '@/components/site/site-chrome'
import { businesses, getBusiness } from '@/lib/businesses'

const heroImage = '/mudogwaluyiira-hero.png'

export function BusinessPage({ slug }: { slug: string }) {
  const business = getBusiness(slug)
  const others = businesses.filter((item) => item.slug !== slug)

  return (
    <PublicSite>
      <section className="relative flex min-h-[560px] items-end overflow-hidden bg-[#15251f] pb-16 pt-36 text-white lg:min-h-[640px] lg:pb-24">
        <img src={heroImage} alt="" className="absolute inset-0 size-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#15251f] via-[#15251f]/75 to-[#15251f]/20" />
        <div className="relative mx-auto w-full max-w-7xl px-5 lg:px-8">
          <p className="mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#d9bb7d]">
            <span className="h-px w-10 bg-[#d9bb7d]" />
            {business.number} · {business.title}
          </p>
          <h1 className="max-w-3xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">{business.headline}</h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/75 lg:text-lg">{business.summary}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <p className="eyebrow">What we offer</p>
        <h2 className="section-title max-w-3xl">{business.title}</h2>
        <p className="mt-7 max-w-2xl text-base leading-7 text-[#65736d]">{business.body}</p>
        <div className="mt-12 grid gap-px bg-[#d9ddd8] md:grid-cols-3">
          {business.offerings.map((offering, index) => (
            <article key={offering.title} className="bg-[#f7f7f5] p-7">
              <p className="text-xs text-[#aab3ae]">0{index + 1}</p>
              <h3 className="mt-10 font-serif text-2xl">{offering.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#65736d]">{offering.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#d9ddd8] bg-[#edeFEB]">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <p className="eyebrow">The group</p>
          <h2 className="section-title">The other businesses.</h2>
          <div className="mt-10 grid gap-px bg-[#d9ddd8] sm:grid-cols-2 lg:grid-cols-4">
            {others.map((item) => (
              <a key={item.slug} href={`/businesses/${item.slug}`} className="group bg-[#f7f7f5] p-6 transition-colors hover:bg-white">
                <p className="text-xs text-[#aab3ae]">{item.number}</p>
                <h3 className="mt-8 font-serif text-2xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#65736d]">{item.summary}</p>
                <span className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]">Learn more <MoveUpRight className="size-3" /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#c9a45c] text-[#15251f]">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 py-16 md:flex-row md:items-center lg:px-8 lg:py-20">
          <div>
            <p className="eyebrow text-[#15251f]/60">Let&apos;s work together</p>
            <h2 className="font-serif text-4xl tracking-[-0.03em] md:text-5xl">Need {business.title.toLowerCase()}?</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#15251f]/70">Tell us what you need and the right Mudogwaluyiira team will follow up.</p>
          </div>
          <RequestServiceButton className="w-fit rounded-none bg-[#15251f] px-7 text-xs font-bold uppercase tracking-[0.16em] text-white hover:bg-[#263f35]">
            Request a service <ArrowRight data-icon="inline-end" />
          </RequestServiceButton>
        </div>
      </section>
    </PublicSite>
  )
}
