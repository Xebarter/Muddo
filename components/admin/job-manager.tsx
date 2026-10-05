'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { finishSave, useAdminProgress } from '@/components/admin/save-progress'
import { StatusBadge } from '@/components/site/design-system'
import { businesses } from '@/lib/businesses'
import { applicationStatuses, employmentTypes, jobStatuses } from '@/lib/careers'
import { deleteJob, deleteJobApplication, saveJob, updateJobApplication } from '@/lib/actions'
import { formatLongDate } from '@/lib/format'
import type { JobApplicationRecord, ManagedJob } from '@/lib/data'

export function JobManager({
  jobs,
  applications,
  unavailable,
}: {
  jobs: ManagedJob[]
  applications: JobApplicationRecord[]
  unavailable?: boolean
}) {
  const [editing, setEditing] = useState<ManagedJob | 'new' | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [jobFilter, setJobFilter] = useState('all')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const { pending, track } = useAdminProgress()
  const visible = applications.filter((item) => jobFilter === 'all' || item.jobId === jobFilter)

  if (unavailable) {
    return <p className="mt-8 border border-dashed border-brand-line bg-white px-6 py-8 text-sm text-brand-muted">Careers are not ready. Run 0006careers.sql, then refresh.</p>
  }

  const run = (task: () => Promise<{ error?: string }>, done: string) => {
    setError('')
    setNotice('')
    void track((report) => finishSave(report, task)).then((result) => {
      if (result.error) setError(result.error)
      else {
        setConfirming(null)
        setNotice(done)
      }
    })
  }

  return (
    <div className="mt-8 space-y-12">
      <section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-brand-muted">{jobs.filter((item) => item.status === 'published').length} published · {jobs.length - jobs.filter((item) => item.status === 'published').length} not on the public page.</p>
          <button type="button" onClick={() => { setEditing('new'); setError(''); setNotice('') }} className="inline-flex h-12 items-center justify-center gap-2 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90">
            <Plus size={15} /> New role
          </button>
        </div>
        {editing && (
          <JobForm
            item={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); setNotice(editing === 'new' ? 'Role added.' : 'Role saved.') }}
          />
        )}
        {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
        {notice && !error && <p className="mt-4 text-sm text-brand-muted" role="status">{notice}</p>}
        {jobs.length === 0 ? (
          <div className="mt-6 border border-dashed border-brand-line bg-white px-6 py-16 text-center">
            <p className="font-serif text-2xl">No roles yet.</p>
            <p className="mt-2 text-sm text-brand-muted">Add a role and publish it when it should appear on the careers page.</p>
          </div>
        ) : (
          <ol className="mt-6 grid gap-4">
            {jobs.map((job) => (
              <li key={job.id} className="border border-brand-line bg-white p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-gold-deep">{job.division}</p>
                  <span className="bg-brand-surface px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">{job.status}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">{job.employmentType}</span>
                </div>
                <h2 className="mt-3 font-serif text-2xl leading-tight">{job.title}</h2>
                <p className="mt-2 text-sm text-brand-muted">{job.location}{job.closingOn ? ` · Closes ${formatLongDate(job.closingOn)}` : ''}</p>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-brand-muted">{job.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <IconButton label="Edit" onClick={() => { setEditing(job); setConfirming(null); setError(''); setNotice('') }}><Pencil size={14} /></IconButton>
                  {confirming === job.id ? (
                    <>
                      <button type="button" disabled={pending} onClick={() => run(() => deleteJob(job.id), 'Role deleted.')} className="h-10 bg-red-800 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">Delete</button>
                      <button type="button" onClick={() => setConfirming(null)} className="h-10 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">Cancel</button>
                    </>
                  ) : (
                    <IconButton label="Delete" onClick={() => setConfirming(job.id)}><Trash2 size={14} /></IconButton>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="border border-brand-line bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-brand-line p-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">Applications</p>
            <h2 className="mt-2 font-serif text-2xl">{visible.length} {visible.length === 1 ? 'application' : 'applications'}</h2>
          </div>
          <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Role
            <select value={jobFilter} onChange={(event) => setJobFilter(event.target.value)} className="mt-2 block h-11 min-w-48 border border-brand-line bg-white px-3 text-sm font-medium normal-case tracking-normal text-brand-ink">
              <option value="all">All roles</option>
              {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
          </label>
        </div>
        {visible.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-brand-muted">No applications yet.</p>
        ) : (
          <ol className="divide-y divide-brand-line">
            {visible.map((item) => (
              <li key={item.id} className="grid gap-4 p-6 lg:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
                    <span className="text-xs text-brand-muted">{item.date}</span>
                  </div>
                  <p className="mt-2 font-serif text-2xl leading-tight">{item.jobTitle}</p>
                  <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-brand-muted">{item.coverLetter}</p>
                  <p className="mt-3 text-xs text-brand-muted">
                    <a href={`mailto:${item.email}`} className="underline decoration-brand-line underline-offset-4">{item.email}</a>
                    {item.phone ? ` · ${item.phone}` : ''}
                    {item.cvUrl ? <> · <a href={item.cvUrl} className="underline decoration-brand-line underline-offset-4">Download CV</a></> : null}
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-2 lg:flex-col">
                  <form
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                      event.preventDefault()
                      const formData = new FormData(event.currentTarget)
                      setError('')
                      void track((report) => finishSave(report, () => updateJobApplication(formData))).then((result) => {
                        if (result.error) setError(result.error)
                      })
                    }}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="id" value={item.id} />
                    <label className="sr-only" htmlFor={`application-${item.id}`}>Status</label>
                    <select id={`application-${item.id}`} name="status" defaultValue={item.rawStatus} className="h-10 border border-brand-line bg-white px-2 text-xs text-brand-ink">
                      {applicationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <button disabled={pending} className="h-10 bg-brand-ink px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">Update</button>
                  </form>
                  <button type="button" disabled={pending} onClick={() => run(() => deleteJobApplication(item.id), 'Application deleted.')} className="h-10 border border-brand-line px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-red-800 hover:border-red-800 disabled:opacity-50">Delete</button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function JobForm({ item, onClose, onSaved }: { item: ManagedJob | null; onClose: () => void; onSaved: () => void }) {
  const matched = businesses.find((business) => business.title.toLowerCase() === item?.division.toLowerCase())
  const [division, setDivision] = useState<string>(matched?.slug ?? businesses[0].slug)
  const [employmentType, setEmploymentType] = useState(item?.employmentType ?? employmentTypes[0])
  const [status, setStatus] = useState(item?.status ?? 'draft')
  const [error, setError] = useState('')
  const { pending, track } = useAdminProgress()

  return (
    <form
      action={async (formData) => {
        const result = await track((report) => finishSave(report, () => saveJob(formData)))
        if (result.error) {
          setError(result.error)
          return
        }
        onSaved()
      }}
      className="mt-6 border border-brand-line bg-white"
    >
      <div className="flex items-center justify-between border-b border-brand-line px-6 py-5">
        <h2 className="font-serif text-2xl">{item ? 'Edit role' : 'New role'}</h2>
        <button type="button" onClick={onClose} className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted hover:text-brand-ink">Cancel</button>
      </div>
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <input type="hidden" name="id" value={item?.id ?? ''} />
        <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted sm:col-span-2">
          Title
          <input name="title" required defaultValue={item?.title ?? ''} className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink" />
        </label>
        <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
          Division
          <select name="division" value={division} onChange={(event) => setDivision(event.target.value)} className="h-11 border border-brand-line bg-white px-3 text-sm font-medium normal-case tracking-normal text-brand-ink">
            {businesses.map((business) => <option key={business.slug} value={business.slug}>{business.title}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
          Type
          <select name="employment_type" value={employmentType} onChange={(event) => setEmploymentType(event.target.value)} className="h-11 border border-brand-line bg-white px-3 text-sm font-medium normal-case tracking-normal text-brand-ink">
            {employmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
          Location
          <input name="location" required defaultValue={item?.location ?? 'Kampala, Uganda'} className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink" />
        </label>
        <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
          Closing date
          <input name="closing_on" type="date" defaultValue={item?.closingOn ?? ''} className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink" />
        </label>
        <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted sm:col-span-2">
          Summary
          <textarea name="summary" required defaultValue={item?.summary ?? ''} rows={3} className="border border-brand-line px-3 py-2 text-sm font-medium normal-case tracking-normal text-brand-ink" />
        </label>
        <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted sm:col-span-2">
          Description
          <textarea name="description" required defaultValue={item?.description ?? ''} rows={8} className="border border-brand-line px-3 py-2 text-sm font-medium normal-case tracking-normal text-brand-ink" />
        </label>
        <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
          Visibility
          <select name="status" value={status} onChange={(event) => setStatus(event.target.value as ManagedJob['status'])} className="h-11 border border-brand-line bg-white px-3 text-sm font-medium normal-case tracking-normal text-brand-ink">
            {jobStatuses.map((value) => <option key={value} value={value}>{value === 'published' ? 'Published on the careers page' : value === 'closed' ? 'Closed' : 'Draft, hidden from the public page'}</option>)}
          </select>
        </label>
      </div>
      <div className="flex flex-col gap-3 border-t border-brand-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs ${error ? 'text-red-700' : 'text-brand-muted'}`} role="status">{error || 'Drafts stay off the public careers page until you publish them.'}</p>
        <button disabled={pending} className="h-12 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90 disabled:opacity-60">{pending ? 'Saving…' : item ? 'Save changes' : 'Add role'}</button>
      </div>
    </form>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="flex size-10 items-center justify-center border border-brand-line text-brand-ink hover:border-brand-ink">
      {children}
    </button>
  )
}
