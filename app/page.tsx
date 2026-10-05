import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  Handshake,
  MoveUpRight,
  Target,
  Users,
  WalletCards,
} from 'lucide-react'
import { PayButton } from '@/components/site/pay-button'
import { RequestServiceButton, SiteChrome } from '@/components/site/site-chrome'
import { businesses } from '@/lib/businesses'
import { companyPhoneDisplay, companyPhoneTel, companyWhatsApp } from '@/lib/contact'
import { getHomepageHero, getPublicContent } from '@/lib/data'

const businessIcons = {
  construction: Building2,
  education: GraduationCap,
  'financial-services': WalletCards,
  'talent-development': Users,
  'events-management': CalendarDays,
} as const

const projects = [
  { title: 'Kampala Heights Residence', category: 'Construction', location: 'Kampala, Uganda', image: '/mudogwaluyiira-hero.png' },
  { title: 'Bright Future Learning Centre', category: 'Education', location: 'Wakiso, Uganda', image: '/mudogwaluyiira-hero.png' },
  { title: 'The Founders Forum 2026', category: 'Events', location: 'Kololo, Kampala', image: '/mudogwaluyiira-hero.png' },
]

const galleryItems = [
  { id: 'gallery-construction', title: 'Site progress at Kampala Heights', category: 'Construction', image: '/mudogwaluyiira-hero.png' },
  { id: 'gallery-education', title: 'Learning spaces for brighter futures', category: 'Education', image: '/mudogwaluyiira-hero.png' },
  { id: 'gallery-talent', title: 'People, purpose and possibility', category: 'Talent development', image: '/mudogwaluyiira-hero.png' },
  { id: 'gallery-events', title: 'Events that bring communities together', category: 'Events management', image: '/mudogwaluyiira-hero.png' },
]

const companyActivities = [
  { id: 'activity-construction', title: 'We build places that move Uganda forward.', text: 'From homes and commercial spaces to civil works, our construction teams turn ambitious plans into durable places.', category: 'Construction', slug: 'construction', image: '/mudogwaluyiira-hero.png' },
  { id: 'activity-education', title: 'We create environments where people learn.', text: 'We support schools and education partners with thoughtful development, management and programmes that widen access to opportunity.', category: 'Education', slug: 'education', image: '/mudogwaluyiira-hero.png' },
  { id: 'activity-financial', title: 'We make progress more accessible.', text: 'Our financial services work is designed around trust, clarity and practical support for individuals and growing businesses.', category: 'Financial services', slug: 'financial-services', image: '/mudogwaluyiira-hero.png' },
  { id: 'activity-talent', title: 'We develop the people behind the potential.', text: 'Through training, mentorship and talent programmes, we help young people and professionals build confidence and capability.', category: 'Talent development', slug: 'talent-development', image: '/mudogwaluyiira-hero.png' },
  { id: 'activity-events', title: 'We bring people together with purpose.', text: 'From corporate gatherings to private celebrations, our events team manages every detail with calm, professional execution.', category: 'Events management', slug: 'events-management', image: '/mudogwaluyiira-hero.png' },
]

export default async function Page() {
  const [published, hero] = await Promise.all([getPublicContent(), getHomepageHero()])
  const activities = published ? published.activities : companyActivities
  const gallery = published ? published.gallery : galleryItems
  const heroImage = hero.image

  return (
    <SiteChrome>
      <section id="top" className="relative flex min-h-[670px] items-end overflow-hidden bg-[#15251f] pb-20 pt-36 text-white lg:min-h-[750px] lg:pb-28">
        <img src={heroImage} alt="Professionals reviewing construction plans at a Ugandan development site" className="absolute inset-0 size-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#15251f] via-[#15251f]/70 to-[#15251f]/10" />
        <div className="relative mx-auto w-full max-w-7xl px-5 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#d9bb7d] sm:tracking-[0.3em]"><span className="h-px w-8 shrink-0 bg-[#d9bb7d] sm:w-10" />A Ugandan group with purpose</p>
            <h1 className="max-w-3xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-8xl">Building businesses.<br /><span className="text-[#d9bb7d]">Developing people.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/75 lg:text-lg">Creating opportunities across construction, education, financial services, talent development and events management.</p>
            <div className="mt-9 flex flex-wrap gap-3"><a href="#our-businesses" className="inline-flex h-8 items-center justify-center gap-2 rounded-none bg-[#c9a45c] px-6 text-xs font-bold uppercase tracking-[0.14em] text-[#15251f] transition-colors hover:bg-[#dbbd7e]">Explore our businesses <ArrowRight data-icon="inline-end" /></a><RequestServiceButton variant="outline" className="rounded-none border-white/45 bg-white/5 px-6 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-white hover:text-[#15251f]">Request a service</RequestServiceButton></div>
          </div>
        </div>
        <div className="absolute bottom-7 right-8 hidden items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-white/60 lg:flex"><span>Scroll to explore</span><ChevronDown /></div>
      </section>

      <section id="our-businesses" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="eyebrow">Our businesses</p><h2 className="section-title">One group.<br /><span className="text-[#b48b45]">Five possibilities.</span></h2></div><p className="max-w-sm text-sm leading-6 text-[#65736d]">We bring deep local understanding, professional standards and a long-term view to every sector we serve.</p></div>
        <div className="grid gap-px bg-[#d9ddd8] md:grid-cols-2 lg:grid-cols-5">{businesses.map((business) => { const Icon = businessIcons[business.slug]; return <article key={business.slug} className="group bg-[#f7f7f5] p-7 transition-colors hover:bg-[#e9eee9] lg:min-h-[290px]"><div className="flex items-start justify-between"><Icon className="text-[#b48b45]" strokeWidth={1.5} /><span className="text-xs text-[#aab3ae]">{business.number}</span></div><h3 className="mt-16 font-serif text-2xl">{business.title}</h3><p className="mt-3 text-sm leading-6 text-[#65736d]">{business.summary}</p><a href={`/businesses/${business.slug}`} className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#15251f]">Learn more <MoveUpRight className="size-3" /></a></article> })}</div>
      </section>

      <section id="company-activities" className="border-y border-[#d9ddd8] bg-[#edeFEB]"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="eyebrow">What we do</p><h2 className="section-title">Our work is<br /><span className="text-[#b48b45]">felt everywhere.</span></h2></div><p className="max-w-sm text-sm leading-6 text-[#65736d]">Five connected businesses. One clear ambition: create useful, lasting value for people and communities.</p></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">{activities.map((activity, index) => <article key={activity.id} className={`group bg-white ${index === 0 ? 'lg:col-span-2' : ''}`}><div className={`relative overflow-hidden ${index === 0 ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}><img src={activity.image} alt={`${activity.category} activity`} className="size-full object-cover grayscale-[20%] transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#15251f]/75 to-transparent" /><p className="absolute bottom-4 left-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d9bb7d]">{activity.category}</p></div><div className="p-5"><h3 className="font-serif text-2xl leading-tight">{activity.title}</h3><p className="mt-3 text-sm leading-6 text-[#65736d]">{activity.text}</p><a href={`/businesses/${activity.slug}`} className="mt-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]">Explore activity <MoveUpRight className="size-3" /></a></div></article>)}</div></div></section>

      <section id="about-us" className="bg-[#15251f] text-white"><div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-28"><div><p className="eyebrow text-[#d9bb7d]">Who we are</p><h2 className="section-title text-white">Rooted here.<br /><span className="text-[#d9bb7d]">Built for what&apos;s next.</span></h2><p className="mt-7 max-w-lg text-base leading-7 text-white/65">Mudogwaluyiira Group of Companies is a proudly Ugandan enterprise bringing together businesses that shape places, people and progress. We believe responsible growth should create value for customers, communities and partners alike.</p><a href="#contact" className="mt-8 inline-flex h-8 items-center justify-center gap-2 rounded-none border border-white/30 px-3 text-sm text-white transition-colors hover:bg-white hover:text-[#15251f]">Learn more about us <ArrowRight data-icon="inline-end" /></a></div><div className="grid grid-cols-2 gap-px bg-white/15"><div className="bg-[#1c3029] p-7"><Target className="text-[#d9bb7d]" /><h3 className="mt-12 font-serif text-2xl">Our vision</h3><p className="mt-3 text-sm leading-6 text-white/60">A stronger, more prosperous Uganda where opportunity is within reach.</p></div><div className="bg-[#1c3029] p-7"><Handshake className="text-[#d9bb7d]" /><h3 className="mt-12 font-serif text-2xl">Our mission</h3><p className="mt-3 text-sm leading-6 text-white/60">To deliver trusted services that build lasting value for every stakeholder.</p></div><div className="col-span-2 bg-[#1c3029] p-7"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d9bb7d]">Our values</p><div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 font-serif text-xl text-white/90"><span>Integrity</span><span>Excellence</span><span>People first</span><span>Accountability</span></div></div></div></div></section>

      <section className="border-b border-[#d9ddd8] bg-[#edeFEB]"><div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-[#d9ddd8] px-5 py-12 md:grid-cols-5 lg:px-8"><Stat value="120+" label="Projects completed" /><Stat value="4,800+" label="People reached" /><Stat value="12" label="Years of experience" /><Stat value="05" label="Business divisions" /><Stat value="98%" label="Partner trust" /></div></section>

      <section id="gallery" className="border-y border-[#d9ddd8] bg-[#edeFEB]"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="eyebrow">Company gallery</p><h2 className="section-title">A closer look at<br /><span className="text-[#b48b45]">our work.</span></h2></div><p className="max-w-sm text-sm leading-6 text-[#65736d]">A living showcase of the places, people and moments shaped by Mudogwaluyiira Group.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{gallery.map((item) => <article key={item.id} className="group bg-white"><div className="aspect-[4/3] overflow-hidden"><img src={item.image} alt={item.title} className="size-full object-cover grayscale-[20%] transition duration-500 group-hover:scale-105" /></div><div className="p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b48b45]">{item.category}</p><h3 className="mt-3 font-serif text-xl leading-tight">{item.title}</h3></div></article>)}</div></div></section>

      <section id="projects" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><div className="mb-12 flex items-end justify-between"><div><p className="eyebrow">Selected work</p><h2 className="section-title">Making progress<br /><span className="text-[#b48b45]">visible.</span></h2></div><a href="#contact" className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] md:flex">View all projects <ArrowRight /></a></div><div className="grid gap-6 md:grid-cols-3">{projects.map((project, i) => <article key={project.title} className={i === 0 ? 'md:col-span-2' : ''}><div className={`relative overflow-hidden bg-[#dfe5df] ${i === 0 ? 'aspect-[16/9]' : 'aspect-[4/5]'}`}><img src={project.image} alt={project.title} className="size-full object-cover grayscale-[20%] transition duration-500 hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#15251f]/80 to-transparent" /><div className="absolute inset-x-5 bottom-5 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d9bb7d]">{project.category} · {project.location}</p><h3 className="mt-2 font-serif text-2xl">{project.title}</h3></div></div></article>)}</div></section>

      <section id="contact" className="bg-[#c9a45c] text-[#15251f]"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 py-16 md:flex-row md:items-center lg:px-8 lg:py-20"><div><p className="eyebrow text-[#15251f]/60">Let&apos;s work together</p><h2 className="font-serif text-4xl tracking-[-0.03em] md:text-5xl">Need our services?</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#15251f]/70">Whether you are building, educating, developing talent or planning an event, we are ready to serve.</p><a href={companyPhoneTel} className="mt-4 inline-flex text-sm font-semibold tracking-wide underline decoration-[#15251f]/30 underline-offset-4 hover:decoration-[#15251f]">{companyPhoneDisplay}</a></div><RequestServiceButton className="w-fit rounded-none bg-[#15251f] px-7 text-xs font-bold uppercase tracking-[0.16em] text-white hover:bg-[#263f35]">Request a service <ArrowRight data-icon="inline-end" /></RequestServiceButton></div></section>

      <PayButton />
      <a
        href={companyWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat with us on WhatsApp at ${companyPhoneDisplay}`}
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-30 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_32px_rgba(15,28,23,0.28)] transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7" fill="currentColor">
          <path d="M20.52 3.48A11.8 11.8 0 0 0 12.06 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.9 11.9 0 0 0 5.76 1.47h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.16-3.45-8.44ZM12.07 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.86 9.86 0 0 1-1.51-5.27c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.13 1.03 7 2.9a9.82 9.82 0 0 1 2.89 7c0 5.45-4.44 9.88-9.89 9.88Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
        </svg>
      </a>
    </SiteChrome>
  )
}

function Stat({ value, label }: { value: string; label: string }) { return <div className="px-4 first:pl-0 last:pr-0"><p className="font-serif text-3xl text-[#15251f] md:text-4xl">{value}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#65736d]">{label}</p></div> }

