'use client'

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { finishSave, useAdminProgress } from '@/components/admin/save-progress'
import { deleteDocument, saveDocument } from '@/lib/actions'
import { documentStatusLabel, documentStatuses, documentTypes } from '@/lib/documents'
import { documentLabel, formatLongDate, todayInKampala } from '@/lib/format'
import type { DocumentCustomer, DocumentService, ManagedDocument } from '@/lib/data'

const fieldClass = 'h-11 border border-brand-line bg-white px-3 text-sm font-medium normal-case tracking-normal text-brand-ink'
const labelClass = 'flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted'

export function DocumentManager({
  documents,
  customers,
  services,
  unavailable,
}: {
  documents: ManagedDocument[]
  customers: DocumentCustomer[]
  services: DocumentService[]
  unavailable?: boolean
}) {
  const [editing, setEditing] = useState<ManagedDocument | 'new' | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const { pending, track } = useAdminProgress()

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return documents.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (customerFilter !== 'all' && item.customerId !== customerFilter) return false
      if (!needle) return true
      return `${item.name} ${item.type} ${item.customerName} ${item.serviceLabel}`.toLowerCase().includes(needle)
    })
  }, [documents, statusFilter, customerFilter, query])

  if (unavailable) {
    return <p className="mt-8 border border-dashed border-brand-line bg-white px-6 py-8 text-sm text-brand-muted">Documents are not ready. Run the Supabase script, then refresh.</p>
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

  const reviewCount = documents.filter((item) => item.status === 'awaiting_review' || item.status === 'draft').length

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-brand-muted">{documents.length} on record · {reviewCount} still in review or draft.</p>
          <p className="mt-1 text-xs text-brand-muted">Drafts stay off the customer account. Every other status is visible there.</p>
        </div>
        <button type="button" onClick={() => { setEditing('new'); setError(''); setNotice('') }} className="inline-flex h-12 w-full items-center justify-center gap-2 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90 sm:w-auto">
          <Plus size={15} /> New document
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, customer, or service" className={fieldClass} />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={fieldClass}>
          <option value="all">All statuses</option>
          {documentStatuses.map((status) => <option key={status} value={status}>{documentLabel(status)}</option>)}
        </select>
        <select value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)} className={fieldClass}>
          <option value="all">All customers</option>
          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
        </select>
      </div>

      {editing && (
        <DocumentForm
          item={editing === 'new' ? null : editing}
          customers={customers}
          services={services}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); setNotice(editing === 'new' ? 'Document filed.' : 'Document saved.') }}
        />
      )}
      {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
      {notice && !error && <p className="mt-4 text-sm text-brand-muted" role="status">{notice}</p>}

      {documents.length === 0 ? (
        <div className="mt-6 border border-dashed border-brand-line bg-white px-6 py-16 text-center">
          <p className="font-serif text-2xl">No documents yet.</p>
          <p className="mt-2 text-sm text-brand-muted">File a contract, quotation, or receipt against a customer.</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-6 border border-brand-line bg-white px-6 py-8 text-sm text-brand-muted">Nothing matches this search.</p>
      ) : (
        <ol className="mt-6 grid gap-4">
          {visible.map((item) => (
            <li key={item.id} className="border border-brand-line bg-white p-5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-gold-deep">{item.type}</p>
                <span className="bg-brand-surface px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">{documentLabel(item.status)}</span>
              </div>
              <h2 className="mt-3 font-serif text-2xl leading-tight">{item.name}</h2>
              <p className="mt-2 text-sm text-brand-muted">{item.customerName}{item.serviceLabel ? ` · ${item.serviceLabel}` : ''} · Filed {formatLongDate(item.filedOn)}</p>
              {item.detail && <p className="mt-3 line-clamp-2 text-sm leading-6 text-brand-muted">{item.detail}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {item.fileUrl ? (
                  <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 border border-brand-line px-3 text-[10px] font-bold uppercase tracking-[0.12em] hover:border-brand-ink">
                    <FileText size={14} /> Open file
                  </a>
                ) : (
                  <span className="text-xs text-brand-muted">No file attached</span>
                )}
                <span className="ml-auto flex gap-2">
                  <IconButton label="Edit document" onClick={() => { setEditing(item); setConfirming(null); setError(''); setNotice('') }}><Pencil size={15} /></IconButton>
                  <IconButton label="Delete document" onClick={() => setConfirming(item.id)}><Trash2 size={15} /></IconButton>
                </span>
              </div>
              {confirming === item.id && (
                <div className="mt-4 flex flex-col gap-3 border-t border-brand-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm">Delete this document? The customer will no longer see it.</p>
                  <span className="flex gap-2">
                    <button type="button" onClick={() => setConfirming(null)} className="h-11 px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">Cancel</button>
                    <button type="button" disabled={pending} onClick={() => run(() => deleteDocument(item.id), 'Document deleted.')} className="h-11 bg-brand-ink px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60">Delete</button>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function DocumentForm({
  item,
  customers,
  services,
  onClose,
  onSaved,
}: {
  item: ManagedDocument | null
  customers: DocumentCustomer[]
  services: DocumentService[]
  onClose: () => void
  onSaved: () => void
}) {
  const { pending, track } = useAdminProgress()
  const [customerId, setCustomerId] = useState(item?.customerId || customers[0]?.id || '')
  const [serviceId, setServiceId] = useState(item?.serviceId ?? '')
  const [error, setError] = useState('')
  const customerServices = services.filter((service) => service.customerId === customerId)
  const typeOptions = item && !documentTypes.includes(item.type as typeof documentTypes[number]) ? [item.type, ...documentTypes] : [...documentTypes]

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setError('')
    void track((report) => finishSave(report, () => saveDocument(formData))).then((result) => {
      if (result.error) setError(result.error)
      else onSaved()
    })
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 border border-brand-line bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-brand-line px-5 py-5 sm:px-6">
        <h2 className="font-serif text-2xl">{item ? 'Edit document' : 'New document'}</h2>
        <button type="button" onClick={onClose} className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted hover:text-brand-ink">Cancel</button>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
        <input type="hidden" name="id" value={item?.id ?? ''} />
        <label className={`${labelClass} sm:col-span-2`}>
          Document name
          <input name="name" required defaultValue={item?.name ?? ''} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Type
          <select name="doc_type" defaultValue={item?.type || 'Contract'} className={fieldClass}>
            {typeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          Status
          <select name="status" defaultValue={item?.status || 'awaiting_review'} className={fieldClass}>
            {documentStatuses.map((status) => <option key={status} value={status}>{documentStatusLabel(status)}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          Customer
          <select name="customer_id" required value={customerId} onChange={(event) => { setCustomerId(event.target.value); setServiceId('') }} className={fieldClass}>
            <option value="">Select a customer</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          Service
          <select name="service_id" value={serviceId} onChange={(event) => setServiceId(event.target.value)} className={fieldClass}>
            <option value="">No specific service</option>
            {customerServices.map((service) => <option key={service.id} value={service.id}>{service.label}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          Filed on
          <input name="filed_on" type="date" required defaultValue={item?.filedOn || todayInKampala()} className={fieldClass} />
        </label>
        <label className={labelClass}>
          File
          <input name="file" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,image/*" className="text-sm font-medium normal-case tracking-normal text-brand-ink file:mr-3 file:h-11 file:border-0 file:bg-brand-surface file:px-3 file:text-[10px] file:font-bold file:uppercase file:tracking-[0.12em]" />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Detail
          <textarea name="detail" defaultValue={item?.detail ?? ''} rows={4} className="border border-brand-line px-3 py-2 text-sm font-medium normal-case tracking-normal text-brand-ink" />
        </label>
        {item?.fileUrl && (
          <label className="flex min-h-11 items-center gap-3 text-sm normal-case tracking-normal text-brand-ink sm:col-span-2">
            <input name="remove_file" type="checkbox" className="size-4" />
            Remove the current file
            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-gold-deep">Open current file</a>
          </label>
        )}
      </div>
      <div className="flex flex-col gap-3 border-t border-brand-line px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className={`text-xs ${error ? 'text-red-700' : 'text-brand-muted'}`} role="status">{error || (customers.length ? 'PDF, Word, or image. Up to 10 MB.' : 'Add a customer before filing a document.')}</p>
        <button disabled={pending || customers.length === 0} className="h-12 w-full bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90 disabled:opacity-60 sm:w-auto">{pending ? 'Saving…' : item ? 'Save changes' : 'File document'}</button>
      </div>
    </form>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="flex size-11 items-center justify-center border border-brand-line text-brand-ink hover:border-brand-ink">
      {children}
    </button>
  )
}
