import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JobApplicationForm } from '@/components/site/job-application-form'
import { SiteChrome } from '@/components/site/site-chrome'
import { getPublicJob } from '@/lib/data'
import { formatLongDate } from '@/lib/format'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const job = await getPublicJob(slug)
  if (!job) return { title: 'Careers | Mudogwaluyiira Group' }
  return {
    title: `${job.title} | Careers | Mudogwaluyiira Group`,
    description: job.summary,
  }
}

export default async function JobPage({ params }: Props) {
  const { slug } = await params
  const job = await getPublicJob(slug)
  if (!job) notFound()
  const paragraphs = job.description.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean)

  return (
    <SiteChrome>
      <section className="bg-[#15251f] px-5 pb-16 pt-32 text-white sm:pt-36 lg:px-8 lg:pb-24 lg:pt-44">
        <div className="mx-auto max-w-7xl">
          <Link href="/careers" className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d9bb7d]">All roles</Link>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">{job.division} · {job.employmentType}</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl tracking-[-0.04em] sm:text-6xl">{job.title}</h1>
          <p className="mt-4 text-sm text-white/70">{job.location}{job.closingOn ? ` · Apply by ${formatLongDate(job.closingOn)}` : ''}</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
        <div>
          <p className="text-base leading-7 text-[#15251f]">{job.summary}</p>
          <div className="mt-8 space-y-5 text-sm leading-7 text-[#65736d]">
            {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>
        <div>
          {job.closed ? (
            <div className="border border-[#d9ddd8] bg-white px-6 py-10">
              <h2 className="font-serif text-3xl">Applications are closed.</h2>
              <p className="mt-3 text-sm leading-6 text-[#65736d]">This role is no longer accepting applications.</p>
              <Link href="/careers" className="mt-6 inline-flex h-12 items-center text-xs font-bold uppercase tracking-[0.14em] text-[#b48b45]">See open roles</Link>
            </div>
          ) : (
            <>
              <p className="eyebrow">Apply</p>
              <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em]">Send your application.</h2>
              <div className="mt-6">
                <JobApplicationForm jobId={job.id} />
              </div>
            </>
          )}
        </div>
      </section>
    </SiteChrome>
  )
}
