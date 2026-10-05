import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicSite } from '@/components/site/public-site'
import { getPublicJobs } from '@/lib/data'
import { formatLongDate } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Careers | Mudogwaluyiira Group of Companies',
  description: 'Open roles at Mudogwaluyiira Group of Companies across construction, education, financial services, talent development and events.',
}

const steps = [
  { title: 'Apply', text: 'Send your CV and a short note about the role you want.' },
  { title: 'Review', text: 'The hiring team reads every application against the work itself.' },
  { title: 'Conversation', text: 'Shortlisted people are invited to talk about the role and the team.' },
]

export default async function CareersPage() {
  const jobs = await getPublicJobs()

  return (
    <PublicSite>
      <section className="bg-[#15251f] px-5 pb-16 pt-32 text-white sm:pt-36 lg:px-8 lg:pb-24 lg:pt-44">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow text-[#d9bb7d]">Careers</p>
          <h1 className="section-title max-w-3xl text-white">Work with<br /><span className="text-[#d9bb7d]">Mudogwaluyiira.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/70">We hire people who want to build places, teach, serve customers and bring communities together. Open roles are posted here.</p>
        </div>
      </section>

      <section className="border-b border-[#d9ddd8]">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-14 sm:grid-cols-3 sm:py-16 lg:px-8">
          {steps.map((step, index) => (
            <article key={step.title} className="border border-[#d9ddd8] bg-white p-6 sm:p-8">
              <p className="text-xs text-[#aab3ae]">0{index + 1}</p>
              <h2 className="mt-6 font-serif text-2xl">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#65736d]">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:py-20 lg:px-8">
        <p className="eyebrow">Open roles</p>
        <h2 className="section-title">Current openings.</h2>
        {jobs === null ? (
          <p className="mt-8 border border-dashed border-[#d9ddd8] bg-white px-6 py-10 text-sm text-[#65736d]">Roles will appear here once the careers list is ready.</p>
        ) : jobs.length === 0 ? (
          <div className="mt-8 border border-[#d9ddd8] bg-white px-6 py-12">
            <h3 className="font-serif text-3xl">No open roles right now.</h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[#65736d]">Check back when a new role is posted, or write to us if you want to be considered later.</p>
            <Link href="/contact" className="mt-6 inline-flex h-12 items-center justify-center bg-[#15251f] px-6 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#263f35]">Contact us</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {jobs.map((job) => (
              <article key={job.id} className="border border-[#d9ddd8] bg-white p-6 sm:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b48b45]">{job.division} · {job.employmentType}</p>
                <h3 className="mt-3 font-serif text-3xl tracking-[-0.03em]">{job.title}</h3>
                <p className="mt-2 text-sm text-[#65736d]">{job.location}{job.closingOn ? ` · Apply by ${formatLongDate(job.closingOn)}` : ''}</p>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[#65736d]">{job.summary}</p>
                <Link href={`/careers/${job.slug}`} className="mt-6 inline-flex h-12 items-center justify-center bg-[#15251f] px-6 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#263f35]">View role</Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </PublicSite>
  )
}
