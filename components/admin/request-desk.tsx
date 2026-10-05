'use client'

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { finishSave, useAdminProgress } from '@/components/admin/save-progress'
import { StatusBadge } from '@/components/site/design-system'
import { businesses } from '@/lib/businesses'
import { deleteServiceRequest, saveServiceRequest, updateRequestStatus } from '@/lib/actions'
import { requestLabel, requestStatuses } from '@/lib/format'
import type { ServiceRequestRecord } from '@/lib/data'

const serviceChoices = [...businesses.map((business) => business.title), 'Other']
const fieldClass = 'h-11 border border-brand-line bg-white px-3 text-sm font-medium normal-case tracking-normal text-brand-ink outline-none focus:border-brand-ink'

export function RequestDesk({ requests }: { requests: ServiceRequestRecord[] | null }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [editing, setEditing] = useState<ServiceRequestRecord | 'new' | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const { pending, track } = useAdminProgress()

  const visible = useMemo(() => (requests ?? []).filter((item) => {
    const haystack = `${item.reference} ${item.name} ${item.email} ${item.phone} ${item.service} ${item.location} ${item.description}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase()) && (status === 'all' || item.rawStatus === status)
  }), [requests, query, status])

  if (!requests) {
    return <p className="mt-8 border border-dashed border-brand-line bg-white px-6 py-8 text-sm text-brand-muted">Service requests could not be loaded. Refresh and try again.</p>
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

  const fresh = requests.filter((item) => item.rawStatus === 'new').length

  return (
    <div className="mt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <p className="text-sm text-brand-muted">{requests.length} {requests.length === 1 ? 'request' : 'requests'} · {fresh} new</p>
        <button type="button" onClick={() => { setEditing('new'); setError(''); setNotice('') }} className="inline-flex h-12 items-center justify-center gap-2 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90">
          <Plus size={15} /> New request
        </button>
      </div>

      {editing && (
        <RequestForm
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(created) => {
            setNotice(created ? 'Request added.' : 'Request saved.')
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
            <span className="sr-only">Search requests</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, reference, or service" aria-label="Search requests" className="w-full bg-transparent text-sm text-brand-ink outline-none placeholder:text-brand-muted" />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status" className={`${fieldClass} sm:w-44`}>
            <option value="all">All statuses</option>
            {requestStatuses.map((item) => <option key={item} value={item}>{requestLabel(item)}</option>)}
          </select>
          <p className="text-xs text-brand-muted sm:ml-auto">{visible.length} shown</p>
        </div>

        {requests.length === 0 ? (
          <Empty title="No requests yet." detail="New enquiries from the site appear here. You can also record one." />
        ) : visible.length === 0 ? (
          <Empty title="Nothing matches." detail="Try another name, reference, or status." />
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
                  <p className="mt-2 font-serif text-2xl leading-tight">{item.service}</p>
                  <p className="mt-2 text-sm text-brand-muted">{item.reference}{item.location ? ` · ${item.location}` : ''}</p>
                  {item.description && <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-brand-muted">{item.description}</p>}
                  <p className="mt-3 text-xs text-brand-muted">
                    <a href={`mailto:${item.email}`} className="underline decoration-brand-line underline-offset-4">{item.email}</a>
                    {item.phone ? ` · ${item.phone}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-2 lg:flex-col lg:items-stretch">
                  <form
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                      event.preventDefault()
                      const formData = new FormData(event.currentTarget)
                      run(() => updateRequestStatus(formData), 'Status updated.')
                    }}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="id" value={item.id} />
                    <label className="sr-only" htmlFor={`request-status-${item.id}`}>Status</label>
                    <select id={`request-status-${item.id}`} name="status" defaultValue={item.rawStatus} className="h-10 border border-brand-line bg-white px-2 text-xs text-brand-ink">
                      {requestStatuses.map((entry) => <option key={entry} value={entry}>{requestLabel(entry)}</option>)}
                    </select>
                    <button disabled={pending} className="h-10 bg-brand-ink px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">Update</button>
                  </form>
                  <div className="flex gap-2">
                    <IconButton label="Edit request" onClick={() => { setEditing(item); setConfirming(null); setError(''); setNotice('') }}><Pencil size={14} /></IconButton>
                    {confirming === item.id ? (
                      <>
                        <button type="button" disabled={pending} onClick={() => run(() => deleteServiceRequest(item.id), 'Request deleted.')} className="h-10 bg-red-800 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">Delete</button>
                        <button type="button" onClick={() => setConfirming(null)} className="h-10 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">Cancel</button>
                      </>
                    ) : (
                      <IconButton label="Delete request" onClick={() => setConfirming(item.id)}><Trash2 size={14} /></IconButton>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function RequestForm({
  item,
  onClose,
  onSaved,
}: {
  item: ServiceRequestRecord | null
  onClose: () => void
  onSaved: (created: boolean) => void
}) {
  const choices = item && !serviceChoices.includes(item.service) ? [item.service, ...serviceChoices] : serviceChoices
  const [service, setService] = useState(item?.service ?? '')
  const [status, setStatus] = useState(item?.rawStatus ?? 'new')
  const [error, setError] = useState('')
  const { pending, track } = useAdminProgress()

  return (
    <form
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        void track((report) => finishSave(report, () => saveServiceRequest(formData))).then((result) => {
          if (result.error) setError(result.error)
          else onSaved(!item)
        })
      }}
      className="mt-6 border border-brand-line bg-white"
    >
      <div className="flex items-center justify-between border-b border-brand-line px-6 py-5">
        <h2 className="font-serif text-2xl">{item ? `Edit ${item.reference}` : 'New request'}</h2>
        <button type="button" onClick={onClose} className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted hover:text-brand-ink">Cancel</button>
      </div>
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <input type="hidden" name="id" value={item?.id ?? ''} />
        <Label text="Name">
          <input name="full_name" required defaultValue={item?.name ?? ''} className={fieldClass} />
        </Label>
        <Label text="Email">
          <input name="email" type="email" required defaultValue={item?.email ?? ''} className={fieldClass} />
        </Label>
        <Label text="Phone">
          <input name="phone" type="tel" defaultValue={item?.phone ?? ''} className={fieldClass} />
        </Label>
        <Label text="Service">
          <select name="service" required value={service} onChange={(event) => setService(event.target.value)} className={fieldClass}>
            <option value="">Choose a service</option>
            {choices.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
          </select>
        </Label>
        <Label text="Location">
          <input name="location" defaultValue={item?.location ?? ''} className={fieldClass} />
        </Label>
        <Label text="Status">
          <select name="status" value={status} onChange={(event) => setStatus(event.target.value as ServiceRequestRecord['rawStatus'])} className={fieldClass}>
            {requestStatuses.map((entry) => <option key={entry} value={entry}>{requestLabel(entry)}</option>)}
          </select>
        </Label>
        <Label text="Description" className="sm:col-span-2">
          <textarea name="description" rows={4} defaultValue={item?.description ?? ''} className="border border-brand-line bg-white px-3 py-3 text-sm font-medium normal-case tracking-normal text-brand-ink outline-none focus:border-brand-ink" />
        </Label>
      </div>
      <div className="flex flex-col gap-3 border-t border-brand-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs ${error ? 'text-red-700' : 'text-brand-muted'}`} role="status">{error || 'A reference is assigned when you save a new request.'}</p>
        <button disabled={pending} className="h-12 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90 disabled:opacity-60">{pending ? 'Saving…' : item ? 'Save changes' : 'Add request'}</button>
      </div>
    </form>
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
