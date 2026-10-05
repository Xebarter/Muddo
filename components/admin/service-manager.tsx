'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { finishSave, saveAdminForm, useAdminProgress } from '@/components/admin/save-progress'
import { businesses } from '@/lib/businesses'
import { deleteService, saveService } from '@/lib/actions'
import { formatUgx } from '@/lib/format'
import type { ManagedService } from '@/lib/data'

const statuses = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On hold' },
] as const

export function ServiceManager({
  services,
  customers,
  homepageImages,
  unavailable,
}: {
  services: ManagedService[]
  customers: { id: string; name: string }[]
  homepageImages: Record<string, string>
  unavailable?: boolean
}) {
  const [editing, setEditing] = useState<ManagedService | 'new' | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const { pending, track } = useAdminProgress()

  const run = (task: () => Promise<{ error?: string }>, done: string) => {
    setError('')
    setNotice('')
    track(async (report) => {
      const result = await finishSave(report, task)
      if (result.error) setError(result.error)
      else setNotice(done)
      return result
    })
  }

  if (unavailable) {
    return <p className="mt-8 border border-dashed border-brand-line bg-white px-6 py-8 text-sm text-brand-muted">Service images are not ready. Run 0003services-image.sql, then refresh.</p>
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-brand-muted">{services.length} {services.length === 1 ? 'service' : 'services'}. A service without its own image uses the homepage image for that division.</p>
        <button
          type="button"
          onClick={() => { setEditing('new'); setError(''); setNotice('') }}
          className="inline-flex h-12 items-center justify-center gap-2 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90"
        >
          <Plus size={15} /> New service
        </button>
      </div>

      {editing && (
        <ServiceForm
          item={editing === 'new' ? null : editing}
          customers={customers}
          homepageImages={homepageImages}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); setNotice(editing === 'new' ? 'Service added.' : 'Service saved.') }}
        />
      )}

      {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
      {notice && !error && <p className="mt-4 text-sm text-brand-muted" role="status">{notice}</p>}

      {services.length === 0 ? (
        <div className="mt-6 border border-dashed border-brand-line bg-white px-6 py-16 text-center">
          <p className="font-serif text-2xl">No services yet.</p>
          <p className="mt-2 text-sm text-brand-muted">Add a service for a customer when work begins.</p>
        </div>
      ) : (
        <ol className="mt-6 grid gap-4">
          {services.map((item) => (
            <li key={item.id} className="grid gap-5 border border-brand-line bg-white p-4 sm:grid-cols-[180px_1fr] sm:p-5">
              <div>
                <img src={item.displayImage} alt="" className="aspect-[4/3] w-full border border-brand-line object-cover" />
                {item.usingHomepageImage && <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">Homepage image</p>}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-gold-deep">{item.division}</p>
                  <span className="bg-brand-surface px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">{statuses.find((status) => status.value === item.status)?.label ?? item.status}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">{item.reference}</span>
                </div>
                <h2 className="mt-3 font-serif text-2xl leading-tight">{item.title}</h2>
                <p className="mt-2 text-sm text-brand-muted">{item.customerName}{item.location ? ` · ${item.location}` : ''} · {item.progress}% · {formatUgx(item.contractValue)}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <IconButton label="Edit" onClick={() => { setEditing(item); setConfirming(null); setError(''); setNotice('') }}><Pencil size={14} /></IconButton>
                  {confirming === item.id ? (
                    <>
                      <button type="button" disabled={pending} onClick={() => run(async () => { const result = await deleteService(item.id); if (!result.error) setConfirming(null); return result }, 'Service deleted.')} className="h-10 bg-red-800 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">Delete</button>
                      <button type="button" onClick={() => setConfirming(null)} className="h-10 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">Cancel</button>
                    </>
                  ) : (
                    <IconButton label="Delete" onClick={() => setConfirming(item.id)}><Trash2 size={14} /></IconButton>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function ServiceForm({
  item,
  customers,
  homepageImages,
  onClose,
  onSaved,
}: {
  item: ManagedService | null
  customers: { id: string; name: string }[]
  homepageImages: Record<string, string>
  onClose: () => void
  onSaved: () => void
}) {
  const matched = businesses.find((business) => business.title.toLowerCase() === item?.division.toLowerCase())
  const [customerId, setCustomerId] = useState(item?.customerId ?? customers[0]?.id ?? '')
  const [division, setDivision] = useState<string>(matched?.slug ?? businesses[0].slug)
  const [title, setTitle] = useState(item?.title ?? '')
  const [location, setLocation] = useState(item?.location ?? '')
  const [stage, setStage] = useState(item?.stage ?? '')
  const [progress, setProgress] = useState(String(item?.progress ?? 0))
  const [contractValue, setContractValue] = useState(String(item?.contractValue ?? 0))
  const [expected, setExpected] = useState(item?.expectedCompletion ?? '')
  const [status, setStatus] = useState(item?.status ?? 'planned')
  const [image, setImage] = useState(item?.image ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState(item?.displayImage || homepageImages[division] || '/mudogwaluyiira-hero.png')
  const [error, setError] = useState('')
  const { pending, track } = useAdminProgress()
  const fallback = businesses.find((business) => business.slug === division)
  const fallbackImage = homepageImages[division] || '/mudogwaluyiira-hero.png'

  useEffect(() => {
    if (!file) {
      setPreview(image.trim() || fallbackImage)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file, image, fallbackImage])

  return (
    <form
      action={async (formData) => {
        const result = await track((report) => saveAdminForm(report, formData, saveService))
        if (result.error) {
          setError(result.error)
          return
        }
        onSaved()
      }}
      className="mt-6 border border-brand-line bg-white"
    >
      <div className="flex items-center justify-between border-b border-brand-line px-6 py-5">
        <h2 className="font-serif text-2xl">{item ? 'Edit service' : 'New service'}</h2>
        <button type="button" onClick={onClose} className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted hover:text-brand-ink">Cancel</button>
      </div>
      <div className="grid gap-5 p-6 lg:grid-cols-[240px_1fr]">
        <div>
          <img src={preview} alt="" className="aspect-[4/3] w-full border border-brand-line object-cover" />
          <p className="mt-2 text-xs leading-5 text-brand-muted">{file || image.trim() ? 'This service image' : `Homepage image for ${fallback?.title ?? 'this division'}`}</p>
        </div>
        <div className="grid content-start gap-5 sm:grid-cols-2">
          <input type="hidden" name="id" value={item?.id ?? ''} />
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted sm:col-span-2">
            Customer
            <select name="customer_id" value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="h-11 border border-brand-line bg-white px-3 text-sm font-medium normal-case tracking-normal text-brand-ink">
              {customers.length === 0 && <option value="">No customers yet</option>}
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Division
            <select name="division" value={division} onChange={(event) => setDivision(event.target.value)} className="h-11 border border-brand-line bg-white px-3 text-sm font-medium normal-case tracking-normal text-brand-ink">
              {businesses.map((business) => <option key={business.slug} value={business.slug}>{business.title}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Status
            <select name="status" value={status} onChange={(event) => setStatus(event.target.value as ManagedService['status'])} className="h-11 border border-brand-line bg-white px-3 text-sm font-medium normal-case tracking-normal text-brand-ink">
              {statuses.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted sm:col-span-2">
            Title
            <input name="title" value={title} onChange={(event) => setTitle(event.target.value)} className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink" />
          </label>
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Location
            <input name="location" value={location} onChange={(event) => setLocation(event.target.value)} className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink" />
          </label>
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Stage
            <input name="stage" value={stage} onChange={(event) => setStage(event.target.value)} className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink" />
          </label>
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Progress
            <input name="progress" type="number" min={0} max={100} value={progress} onChange={(event) => setProgress(event.target.value)} className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink" />
          </label>
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Contract value (UGX)
            <input name="contract_value" type="number" min={0} value={contractValue} onChange={(event) => setContractValue(event.target.value)} className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink" />
          </label>
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted sm:col-span-2">
            Expected completion
            <input name="expected_completion" type="date" value={expected} onChange={(event) => setExpected(event.target.value)} className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink" />
          </label>
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Image address
            <input name="image_path" value={image} onChange={(event) => setImage(event.target.value)} placeholder="Leave empty to use the homepage image" className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink" />
          </label>
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Or upload an image
            <input
              name="image"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const next = event.target.files?.[0] ?? null
                if (next && (!next.type.startsWith('image/') || next.size > 5_000_000)) {
                  event.target.value = ''
                  setFile(null)
                  setError('Choose an image under 5 MB.')
                  return
                }
                setError('')
                setFile(next)
              }}
              className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink file:mr-3 file:border-0 file:bg-transparent file:text-[10px] file:font-bold file:uppercase file:tracking-[0.12em]"
            />
          </label>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-brand-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs ${error ? 'text-red-700' : 'text-brand-muted'}`} role="status">{error || 'Leave the image empty to use the homepage image for this division.'}</p>
        <button disabled={pending || customers.length === 0} className="h-12 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90 disabled:opacity-60">{pending ? 'Saving…' : item ? 'Save changes' : 'Add service'}</button>
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
