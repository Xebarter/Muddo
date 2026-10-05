'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { businesses } from '@/lib/businesses'
import { deleteContentItem, moveContentItem, saveContentItem, setContentStatus } from '@/lib/actions'
import type { ManagedContent } from '@/lib/data'

export function ContentManager({
  kind,
  items,
  unavailable,
}: {
  kind: 'activity' | 'gallery'
  items: ManagedContent[]
  unavailable?: boolean
}) {
  const [editing, setEditing] = useState<ManagedContent | 'new' | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const noun = kind === 'activity' ? 'story' : 'image'
  const published = items.filter((item) => item.status === 'published').length

  const run = (task: () => Promise<{ error?: string }>) => {
    setError('')
    startTransition(async () => {
      const result = await task()
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-brand-muted">
          {unavailable
            ? 'The content tables are not ready. Run the Supabase script, then refresh.'
            : `${published} published · ${items.length - published} draft. The first published ${noun} leads the homepage.`}
        </p>
        <button
          type="button"
          onClick={() => { setEditing('new'); setError('') }}
          className="inline-flex h-12 items-center justify-center gap-2 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90"
        >
          <Plus size={15} /> New {noun}
        </button>
      </div>

      {editing && (
        <ContentForm
          kind={kind}
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}

      {items.length === 0 && !unavailable ? (
        <div className="mt-6 border border-dashed border-brand-line bg-white px-6 py-16 text-center">
          <p className="font-serif text-2xl">Nothing on the homepage yet.</p>
          <p className="mt-2 text-sm text-brand-muted">Add a {noun} and publish it when it is ready to show.</p>
        </div>
      ) : (
        <ol className="mt-6 grid gap-4">
          {items.map((item, index) => (
            <li key={item.id} className="grid gap-5 border border-brand-line bg-white p-4 sm:grid-cols-[180px_1fr] sm:p-5">
              <img src={item.image || '/mudogwaluyiira-hero.png'} alt="" className="aspect-[4/3] w-full border border-brand-line object-cover" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-gold-deep">{item.category}</p>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${item.status === 'published' ? 'bg-[#dce9df] text-[#28704d]' : 'bg-brand-surface text-brand-muted'}`}>
                    {item.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">Position {index + 1}</span>
                </div>
                <h2 className="mt-3 font-serif text-2xl leading-tight">{item.title}</h2>
                {item.body && <p className="mt-2 line-clamp-2 text-sm leading-6 text-brand-muted">{item.body}</p>}
                <div className="mt-5 flex flex-wrap gap-2">
                  <IconButton label="Move earlier" disabled={pending || index === 0} onClick={() => run(() => moveContentItem(kind, item.id, 'up'))}><ArrowUp size={14} /></IconButton>
                  <IconButton label="Move later" disabled={pending || index === items.length - 1} onClick={() => run(() => moveContentItem(kind, item.id, 'down'))}><ArrowDown size={14} /></IconButton>
                  <IconButton label="Edit" onClick={() => { setEditing(item); setConfirming(null); setError('') }}><Pencil size={14} /></IconButton>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => setContentStatus(kind, item.id, item.status === 'published' ? 'draft' : 'published'))}
                    className="h-10 border border-brand-line px-3 text-[10px] font-bold uppercase tracking-[0.12em] hover:border-brand-ink disabled:opacity-50"
                  >
                    {item.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  {confirming === item.id ? (
                    <>
                      <button type="button" disabled={pending} onClick={() => run(async () => { const result = await deleteContentItem(kind, item.id); if (!result.error) setConfirming(null); return result })} className="h-10 bg-red-800 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">Delete</button>
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

function ContentForm({
  kind,
  item,
  onClose,
}: {
  kind: 'activity' | 'gallery'
  item: ManagedContent | null
  onClose: () => void
}) {
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const matched = businesses.find((business) => business.slug === item?.slug) ?? businesses.find((business) => business.title.toLowerCase() === item?.category.toLowerCase())
  const [slug, setSlug] = useState<string>(matched?.slug ?? businesses[0].slug)

  return (
    <form
      action={async (formData) => {
        setPending(true)
        const result = await saveContentItem(formData)
        setPending(false)
        if (result.error) {
          setError(result.error)
          return
        }
        onClose()
      }}
      className="mt-6 border border-brand-line bg-white"
    >
      <div className="flex items-center justify-between border-b border-brand-line px-6 py-5">
        <h2 className="font-serif text-2xl">{item ? 'Edit' : 'New'} {kind === 'activity' ? 'story' : 'image'}</h2>
        <button type="button" onClick={onClose} className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted hover:text-brand-ink">Cancel</button>
      </div>
      <div className="grid gap-5 p-6">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={item?.id ?? ''} />
        <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
          Division
          <select name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} className="h-11 border border-brand-line bg-white px-3 text-sm font-medium normal-case tracking-normal text-brand-ink">
            {businesses.map((business) => <option key={business.slug} value={business.slug}>{business.title}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
          Title
          <input name="title" required defaultValue={item?.title ?? ''} className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink" />
        </label>
        {kind === 'activity' && (
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Story
            <textarea name="body" required defaultValue={item?.body ?? ''} rows={4} className="border border-brand-line px-3 py-2 text-sm font-medium normal-case tracking-normal text-brand-ink" />
          </label>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Image address
            <input name="image_path" defaultValue={item?.image ?? ''} placeholder="/mudogwaluyiira-hero.png" className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink" />
          </label>
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Or upload an image
            <input name="image" type="file" accept="image/*" className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink file:mr-3 file:border-0 file:bg-transparent file:text-[10px] file:font-bold file:uppercase file:tracking-[0.12em]" />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
          Visibility
          <select name="status" defaultValue={item?.status ?? 'draft'} className="h-11 border border-brand-line bg-white px-3 text-sm font-medium normal-case tracking-normal text-brand-ink">
            <option value="draft">Draft, hidden from the homepage</option>
            <option value="published">Published on the homepage</option>
          </select>
        </label>
      </div>
      <div className="flex flex-col gap-3 border-t border-brand-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-brand-muted" role="status">{error || 'Drafts stay off the public homepage until you publish them.'}</p>
        <button disabled={pending} className="h-12 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90 disabled:opacity-60">{pending ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  )
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="flex size-10 items-center justify-center border border-brand-line text-brand-ink hover:border-brand-ink disabled:opacity-40">
      {children}
    </button>
  )
}
