import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Building2, CalendarDays, GraduationCap, Users, WalletCards } from 'lucide-react'
import { PublicSite } from '@/components/site/public-site'
import { RequestServiceButton } from '@/components/site/site-chrome'
import { businesses } from '@/lib/businesses'
import { getHomepageHero, getPublicContent } from '@/lib/data'

export const metadata: Metadata = {
  title: 'What we do | Mudogwaluyiira Group of Companies',
  description: 'Construction, education, financial services, talent development and events management from Mudogwaluyiira Group of Companies.',
}

const icons = {
  construction: Building2,
  education: GraduationCap,
  'financial-services': WalletCards,
  'talent-development': Users,
  'events-management': CalendarDays,
} as const

function belongsToBusiness(story: { slug: string; category: string }, business: { slug: string; title: string }) {
  const category = story.category.trim().toLowerCase()
  return story.slug === business.slug || category === business.title.toLowerCase() || category === business.slug
}

function StoryCard({ story, href }: { story: { id: string; title: string; text: string; category: string; image: string }; href?: string }) {
  return (
    <article id={story.id} className="flex h-full flex-col overflow-hidden bg-white">
      <div className="aspect-[16/10] overflow-hidden"><img src={story.image || '/mudogwaluyiira-hero.png'} alt="" className="size-full object-cover" /></div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {story.category.trim() && <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b48b45]">{story.category}</p>}
        <h3 className="mt-2 font-serif text-2xl leading-tight">{story.title}</h3>
        <p className="mt-3 text-sm leading-6 text-[#65736d]">{story.text}</p>
        {href && <Link href={href} className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]">Learn more <ArrowRight className="size-3" /></Link>}
      </div>
    </article>
  )
}

const approach = [
  { title: 'Local understanding', text: 'The work is done in Uganda, for the places and people it is meant to serve.' },
  { title: 'Professional standards', text: 'Each business is delivered in clear stages, with care from the first conversation to the last.' },
  { title: 'A long-term view', text: 'The aim is useful, lasting value for customers, communities and partners.' },
]

const fallbackStories = [
  { id: 'activity-construction', title: 'We build places that move Uganda forward.', text: 'From homes and commercial spaces to civil works, our construction teams turn ambitious plans into durable places.', category: 'Construction', slug: 'construction', image: '/mudogwaluyiira-hero.png' },
  { id: 'activity-education', title: 'We create environments where people learn.', text: 'We support schools and education partners with thoughtful development, management and programmes that widen access to opportunity.', category: 'Education', slug: 'education', image: '/mudogwaluyiira-hero.png' },
  { id: 'activity-financial', title: 'We make progress more accessible.', text: 'Our financial services work is designed around trust, clarity and practical support for individuals and growing businesses.', category: 'Financial services', slug: 'financial-services', image: '/mudogwaluyiira-hero.png' },
  { id: 'activity-talent', title: 'We develop the people behind the potential.', text: 'Through training, mentorship and talent programmes, we help young people and professionals build confidence and capability.', category: 'Talent development', slug: 'talent-development', image: '/mudogwaluyiira-hero.png' },
  { id: 'activity-events', title: 'We bring people together with purpose.', text: 'From corporate gatherings to private celebrations, our events team manages every detail with calm, professional execution.', category: 'Events management', slug: 'events-management', image: '/mudogwaluyiira-hero.png' },
]

export default async function WhatWeDoPage() {
  const [published, hero] = await Promise.all([getPublicContent(), getHomepageHero()])
  const stories = published?.activities?.length ? published.activities : fallbackStories
  const byBusiness = new Map(businesses.map((business) => [business.slug, [] as typeof stories]))
  const extras = stories.filter((story) => {
    const business = businesses.find((item) => belongsToBusiness(story, item))
    if (!business) return true
    byBusiness.get(business.slug)?.push(story)
    return false
  })
  const groups = businesses.map((business) => ({ business, stories: byBusiness.get(business.slug) ?? [] }))

  return (
    <PublicSite>
      <section className="relative flex min-h-[70svh] items-end overflow-hidden bg-[#15251f] pb-14 pt-28 text-white sm:min-h-[560px] sm:pb-20 sm:pt-36 lg:pb-24">
        <img src={hero.image} alt="" className="absolute inset-0 size-full object-cover object-[72%_center] opacity-60 sm:object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#15251f]/90 via-[#15251f]/70 to-[#15251f]/25" />
        <div className="relative mx-auto w-full max-w-7xl px-5 lg:px-8">
          <p className="eyebrow text-[#d9bb7d]">What we do</p>
          <h1 className="mt-3 max-w-3xl font-serif text-[2.4rem] leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">One group.<br /><span className="text-[#d9bb7d]">Five possibilities.</span></h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/75">Construction, education, financial services, talent development and events management. One standard of care across all five.</p>
          <RequestServiceButton className="mt-7 h-12 w-full rounded-none bg-[#c9a45c] px-6 text-xs font-bold uppercase tracking-[0.14em] text-[#15251f] hover:bg-[#dbbd7e] sm:w-auto">
            Request a service
          </RequestServiceButton>
        </div>
      </section>

      <nav aria-label="The five businesses" className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-10 border-b border-[#d9ddd8] bg-[#f7f7f5]/95 backdrop-blur-md sm:top-[calc(5rem+env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 lg:px-8">
          {businesses.map((business) => (
            <a key={business.slug} href={`#${business.slug}`} className="inline-flex h-11 shrink-0 items-center border border-[#d9ddd8] bg-white px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#15251f] hover:border-[#15251f]">
              {business.number} {business.title}
            </a>
          ))}
        </div>
      </nav>

      <section className="border-b border-[#d9ddd8]">
        <div className="mx-auto grid max-w-7xl gap-px bg-[#d9ddd8] px-0 sm:grid-cols-3">
          {approach.map((item, index) => (
            <article key={item.title} className="bg-[#f7f7f5] px-5 py-8 sm:px-7 sm:py-10">
              <p className="text-xs text-[#aab3ae]">0{index + 1}</p>
              <h2 className="mt-6 font-serif text-2xl leading-tight">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#65736d]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      {groups.map(({ business, stories: groupStories }, index) => {
        const [story, ...more] = groupStories
        const Icon = icons[business.slug]
        const image = story?.image || hero.image
        return (
          <section key={business.slug} id={business.slug} className="scroll-mt-36 border-b border-[#d9ddd8] sm:scroll-mt-40">
            <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
              <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                <div className="relative aspect-[16/10] overflow-hidden bg-[#dfe5df]">
                  <img src={image} alt="" className="size-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#15251f]/55 to-transparent" />
                  <p className="absolute bottom-4 left-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d9bb7d]">{business.title}</p>
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <p className="eyebrow">{business.number}</p>
                  <Icon className="text-[#b48b45]" strokeWidth={1.5} />
                </div>
                <h2 className="mt-3 font-serif text-[2rem] leading-[1.05] tracking-[-0.03em] sm:text-5xl">{story?.title ?? business.headline}</h2>
                <p className="mt-4 text-sm leading-6 text-[#65736d] sm:text-base sm:leading-7">{story?.text ?? business.body}</p>
                <Link href={`/businesses/${business.slug}`} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 bg-[#15251f] px-6 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#263f35] sm:w-auto">
                  Learn more <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
            <div className="mx-auto grid max-w-7xl gap-px bg-[#d9ddd8] sm:grid-cols-3 lg:px-8">
              {business.offerings.map((offering, offeringIndex) => (
                <article key={offering.title} className="bg-white px-5 py-7 sm:px-7">
                  <p className="text-xs text-[#aab3ae]">0{offeringIndex + 1}</p>
                  <h3 className="mt-5 font-serif text-2xl">{offering.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#65736d]">{offering.text}</p>
                </article>
              ))}
            </div>
            {more.length > 0 && (
              <div className="border-t border-[#d9ddd8] bg-[#edeFEB]">
                <div className="mx-auto grid max-w-7xl gap-4 px-5 py-10 sm:grid-cols-2 lg:px-8 lg:py-14">
                  {more.map((item) => <StoryCard key={item.id} story={item} href={`/businesses/${business.slug}`} />)}
                </div>
              </div>
            )}
          </section>
        )
      })}

      {extras.length > 0 && (
        <section className="bg-[#edeFEB]">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:py-16 lg:px-8 lg:py-20">
            <p className="eyebrow">Also underway</p>
            <h2 className="section-title">More of the work.</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {extras.map((story) => <StoryCard key={story.id} story={story} />)}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#c9a45c] text-[#15251f]">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 py-14 sm:py-16 md:flex-row md:items-center lg:px-8 lg:py-20">
          <div>
            <p className="eyebrow text-[#15251f]/60">Let&apos;s work together</p>
            <h2 className="font-serif text-4xl tracking-[-0.03em] md:text-5xl">Need our services?</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#15251f]/70">Tell us which business you need. The right team will follow up.</p>
          </div>
          <RequestServiceButton className="h-12 w-full rounded-none bg-[#15251f] px-7 text-xs font-bold uppercase tracking-[0.16em] text-white hover:bg-[#263f35] sm:w-fit">
            Request a service <ArrowRight data-icon="inline-end" />
          </RequestServiceButton>
        </div>
      </section>
    </PublicSite>
  )
}
