'use client'

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { finishSave, useAdminProgress } from '@/components/admin/save-progress'
import { deleteProgressUpdate, saveProgressUpdate } from '@/lib/actions'
import type { ProgressDeskData, ProgressUpdateRecord } from '@/lib/data'

const fieldClass = 'h-11 border border-brand-line bg-white px-3 text-sm font-medium normal-case tracking-normal text-brand-ink outline-none focus:border-brand-ink'

export function ProgressDesk({ desk, today }: { desk: ProgressDeskData | null; today: string }) {
  const [query, setQuery] = useState('')
  const [serviceId, setServiceId] = useState('all')
  const [editing, setEditing] = useState<ProgressUpdateRecord | 'new' | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const { pending, track } = useAdminProgress()

  const updates = desk?.updates ?? []
  const visible = useMemo(() => updates.filter((item) => {
    const haystack = `${item.title} ${item.body} ${item.serviceLabel}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase()) && (serviceId === 'all' || item.serviceId === serviceId)
  }), [updates, query, serviceId])

  if (!desk) {
    return <p className="mt-8 border border-dashed border-brand-line bg-white px-6 py-8 text-sm text-brand-muted">Progress updates could not be loaded. Refresh and try again.</p>
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

  const covered = new Set(updates.map((item) => item.serviceId)).size
  const latest = new Map<string, number>()
  for (const item of updates) {
    if (!latest.has(item.serviceId)) latest.set(item.serviceId, item.progress)
  }
  const average = latest.size ? Math.round([...latest.values()].reduce((sum, value) => sum + value, 0) / latest.size) : 0

  return (
    <div className="mt-8">
      <section className="grid overflow-hidden border border-brand-ink bg-brand-ink text-white sm:grid-cols-3">
        <Figure label="Updates" value={String(updates.length).padStart(2, '0')} note="Published for customers" />
        <Figure label="Services" value={String(covered).padStart(2, '0')} note="With at least one update" rule />
        <Figure label="Latest average" value={`${average}%`} note="Newest update on each service" rule />
      </section>

      <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <p className="text-sm text-brand-muted">The newest update sets the percentage on the customer’s service.</p>
        <button type="button" onClick={() => { setEditing('new'); setError(''); setNotice('') }} className="inline-flex h-12 items-center justify-center gap-2 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90">
          <Plus size={15} /> New update
        </button>
      </div>

      {editing && (
        <ProgressForm
          item={editing === 'new' ? null : editing}
          services={desk.services}
          today={today}
          onClose={() => setEditing(null)}
          onSaved={(created) => {
            setNotice(created ? 'Update published.' : 'Update saved.')
            setError('')
            setEditing(null)
          }}
        />
      )}

      {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
      {notice && !error && <p className="mt-4 text-sm text-brand-muted" role="status">{notice}</p>}

      <section className="mt-6 border border-brand-line bg-white">
        <div className="flex flex-col gap-3 border-b border-brand-line px-6 py-4 sm:flex-row sm:items-center">
          <label className="flex h-11 flex-1 items-center gap-2 border border-brand-line bg-white px-3 text-brand-muted">
            <Search size={16} />
            <span className="sr-only">Search updates</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, service, or note" aria-label="Search updates" className="w-full bg-transparent text-sm text-brand-ink outline-none placeholder:text-brand-muted" />
          </label>
          <select value={serviceId} onChange={(event) => setServiceId(event.target.value)} aria-label="Filter by service" className={`${fieldClass} sm:max-w-xs`}>
            <option value="all">All services</option>
            {desk.services.map((service) => <option key={service.id} value={service.id}>{service.label}</option>)}
          </select>
          <p className="text-xs text-brand-muted sm:ml-auto">{visible.length} shown</p>
        </div>

        {updates.length === 0 ? (
          <Empty title="No updates yet." detail="Publish one so the customer can see what changed." />
        ) : visible.length === 0 ? (
          <Empty title="Nothing matches." detail="Try another title or service." />
        ) : (
          <ol className="divide-y divide-brand-line">
            {visible.map((item) => (
              <li key={item.id} className="grid gap-4 p-6 lg:grid-cols-[1fr_auto] lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-serif text-3xl leading-none tracking-[-0.04em] tabular-nums">{item.progress}<span className="text-lg text-brand-gold">%</span></p>
                    <span className="text-xs text-brand-muted">{item.date}</span>
                  </div>
                  <p className="mt-3 font-serif text-2xl leading-tight">{item.title}</p>
                  <p className="mt-2 text-sm text-brand-muted">{item.serviceLabel}</p>
                  {item.body && <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-brand-muted">{item.body}</p>}
                  <div className="mt-4 h-1.5 max-w-xs bg-[#f7f7f5]">
                    <div className="h-full bg-[#28704d]" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <IconButton label="Edit update" onClick={() => { setEditing(item); setConfirming(null); setError(''); setNotice('') }}><Pencil size={14} /></IconButton>
                  {confirming === item.id ? (
                    <>
                      <button type="button" disabled={pending} onClick={() => run(() => deleteProgressUpdate(item.id), 'Update deleted.')} className="h-10 bg-red-800 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">Delete</button>
                      <button type="button" onClick={() => setConfirming(null)} className="h-10 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">Cancel</button>
                    </>
                  ) : (
                    <IconButton label="Delete update" onClick={() => setConfirming(item.id)}><Trash2 size={14} /></IconButton>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function ProgressForm({
  item,
  services,
  today,
  onClose,
  onSaved,
}: {
  item: ProgressUpdateRecord | null
  services: { id: string; label: string }[]
  today: string
  onClose: () => void
  onSaved: (created: boolean) => void
}) {
  const [error, setError] = useState('')
  const { pending, track } = useAdminProgress()
  const known = services.some((service) => service.id === item?.serviceId)

  return (
    <form
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        void track((report) => finishSave(report, () => saveProgressUpdate(formData))).then((result) => {
          if (result.error) setError(result.error)
          else onSaved(!item)
        })
      }}
      className="mt-6 border border-brand-line bg-white"
    >
      <div className="flex items-center justify-between border-b border-brand-line px-6 py-5">
        <h2 className="font-serif text-2xl">{item ? 'Edit update' : 'New update'}</h2>
        <button type="button" onClick={onClose} className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted hover:text-brand-ink">Cancel</button>
      </div>
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <input type="hidden" name="id" value={item?.id ?? ''} />
        <Label text="Service" className="sm:col-span-2">
          <select name="service_id" required defaultValue={item?.serviceId ?? ''} className={fieldClass}>
            <option value="">Select a service</option>
            {item && !known && <option value={item.serviceId}>{item.serviceLabel}</option>}
            {services.map((service) => <option key={service.id} value={service.id}>{service.label}</option>)}
          </select>
        </Label>
        <Label text="Title">
          <input name="title" required minLength={2} maxLength={120} defaultValue={item?.title ?? ''} className={fieldClass} />
        </Label>
        <Label text="Published">
          <input name="published_on" type="date" required defaultValue={item?.publishedOn || today} className={fieldClass} />
        </Label>
        <Label text="Progress percent">
          <input name="progress" type="number" required min={0} max={100} step={1} defaultValue={item?.progress ?? 0} className={fieldClass} />
        </Label>
        <Label text="What changed" className="sm:col-span-2">
          <textarea name="body" rows={4} maxLength={2000} defaultValue={item?.body ?? ''} className="border border-brand-line bg-white px-3 py-3 text-sm font-medium normal-case tracking-normal text-brand-ink outline-none focus:border-brand-ink" />
        </Label>
      </div>
      <div className="flex flex-col gap-3 border-t border-brand-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs ${error ? 'text-red-700' : 'text-brand-muted'}`} role="status">{error || 'Customers see this on their service, and the latest one sets the progress bar.'}</p>
        <button disabled={pending || services.length === 0} className="h-12 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90 disabled:opacity-60">{pending ? 'Saving…' : item ? 'Save changes' : 'Publish update'}</button>
      </div>
    </form>
  )
}

function Figure({ label, value, note, rule = false }: { label: string; value: string; note: string; rule?: boolean }) {
  return (
    <div className={`px-6 py-7 ${rule ? 'sm:border-l sm:border-white/10' : ''}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-light">{label}</p>
      <p className="mt-3 font-serif text-3xl tracking-[-0.04em] tabular-nums">{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/45">{note}</p>
    </div>
  )
}

function Label({ text, className = '', children }: { text: string; className?: string; children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted ${className}`}>
      {text}
      {children}
    </label>
  )
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-serif text-2xl">{title}</p>
      <p className="mt-2 text-sm text-brand-muted">{detail}</p>
    </div>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="flex size-10 items-center justify-center border border-brand-line text-brand-ink hover:border-brand-ink">
      {children}
    </button>
  )
}
