'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { finishSave, saveAdminForm, useAdminProgress } from '@/components/admin/save-progress'
import { businesses } from '@/lib/businesses'
import { moveContentItem, saveContentItem, setContentStatus } from '@/lib/actions'
import type { ManagedContent } from '@/lib/data'

const maxImageBytes = 5_000_000

type Leave = { next: ManagedContent | 'new' | null }

async function removeContent(kind: 'activity' | 'gallery', id: string) {
  const response = await fetch('/api/admin/content', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, id }),
  })
  const payload = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) return { error: payload.error || 'The record could not be deleted.' }
  return {}
}

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
  const [notice, setNotice] = useState('')
  const [highlight, setHighlight] = useState<string | null>(null)
  const [leave, setLeave] = useState<Leave | null>(null)
  const dirtyRef = useRef(false)
  const leaveRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { pending, track } = useAdminProgress()
  const noun = kind === 'activity' ? 'story' : 'image'
  const published = items.filter((item) => item.status === 'published').length
  const leadId = kind === 'activity' ? items.find((item) => item.status === 'published')?.id : undefined

  const markDirty = useCallback((value: boolean) => {
    dirtyRef.current = value
  }, [])

  const applyEditor = useCallback((next: ManagedContent | 'new' | null) => {
    dirtyRef.current = false
    setLeave(null)
    setEditing(next)
    setConfirming(null)
    setError('')
  }, [])

  const requestEditor = useCallback((next: ManagedContent | 'new' | null) => {
    if (next === editing || (next && next !== 'new' && editing !== 'new' && editing?.id === next.id)) return
    if (dirtyRef.current) {
      setLeave({ next })
      return
    }
    applyEditor(next)
  }, [applyEditor, editing])

  useEffect(() => {
    if (!highlight) return
    document.querySelector(`[data-content-id="${CSS.escape(highlight)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [highlight, items])

  useEffect(() => {
    leaveRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [leave])

  const run = (task: () => Promise<{ error?: string }>, success: string) => {
    setError('')
    setNotice('')
    void track((report) => finishSave(report, task)).then((result) => {
      if (result.error) setError(result.error)
      else setNotice(success)
    })
  }

  const saved = (id: string | undefined, created: boolean) => {
    setNotice(created ? `${capitalize(noun)} added.` : `${capitalize(noun)} saved.`)
    if (id) setHighlight(id)
    applyEditor(null)
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-brand-muted">
          {unavailable
            ? 'The content tables are not ready. Run the Supabase script, then refresh.'
            : `${published} published · ${items.length - published} draft.${kind === 'activity' ? ' The first published story leads the homepage.' : ''}`}
        </p>
        <button
          type="button"
          onClick={() => { setNotice(''); requestEditor('new') }}
          className="inline-flex h-12 items-center justify-center gap-2 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90"
        >
          <Plus size={15} /> New {noun}
        </button>
      </div>

      {notice && <p className="mt-4 border border-[#dce9df] bg-[#f3f8f4] px-4 py-3 text-sm text-[#28704d]" role="status">{notice}</p>}
      {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
      {leave && (
        <div ref={leaveRef} className="mt-4 flex flex-col gap-3 border border-brand-line bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">You have unsaved changes on this {noun}.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => applyEditor(leave.next)} className="h-10 bg-brand-ink px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Discard</button>
            <button type="button" onClick={() => setLeave(null)} className="h-10 border border-brand-line px-3 text-[10px] font-bold uppercase tracking-[0.12em]">Keep editing</button>
          </div>
        </div>
      )}

      {editing === 'new' && (
        <ContentForm kind={kind} item={null} onDirty={markDirty} onClose={() => requestEditor(null)} onSaved={saved} />
      )}

      {items.length === 0 && !unavailable && editing !== 'new' ? (
        <div className="mt-6 border border-dashed border-brand-line bg-white px-6 py-16 text-center">
          <p className="font-serif text-2xl">Nothing on the homepage yet.</p>
          <p className="mt-2 text-sm text-brand-muted">Add a {noun} and publish it when it is ready to show.</p>
        </div>
      ) : (
        <ol className="mt-6 grid gap-4">
          {items.map((item, index) => (
            <li key={item.id} data-content-id={item.id} className={`border bg-white ${highlight === item.id || (editing !== 'new' && editing?.id === item.id) ? 'border-brand-ink' : 'border-brand-line'}`}>
              {editing !== 'new' && editing?.id === item.id ? (
                <ContentForm kind={kind} item={item} embedded onDirty={markDirty} onClose={() => requestEditor(null)} onSaved={saved} />
              ) : (
                <div className="grid gap-5 p-4 sm:grid-cols-[180px_1fr] sm:p-5">
                  <img src={item.image || '/mudogwaluyiira-hero.png'} alt="" className="aspect-[4/3] w-full border border-brand-line object-cover" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-gold-deep">{item.category}</p>
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${item.status === 'published' ? 'bg-[#dce9df] text-[#28704d]' : 'bg-brand-surface text-brand-muted'}`}>
                        {item.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                      {leadId === item.id && <span className="bg-[#f3f0e6] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-ink">Shown first</span>}
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">Position {index + 1}</span>
                    </div>
                    <h2 className="mt-3 font-serif text-2xl leading-tight">{item.title}</h2>
                    {item.body && <p className="mt-2 line-clamp-2 text-sm leading-6 text-brand-muted">{item.body}</p>}
                    {confirming === item.id && <p className="mt-4 text-sm">Delete this {noun}? It will leave the homepage.</p>}
                    <div className="mt-5 flex flex-wrap gap-2">
                      <IconButton label="Move earlier" disabled={pending || editing !== null || index === 0} onClick={() => run(() => moveContentItem(kind, item.id, 'up'), 'Order updated.')}><ArrowUp size={14} /></IconButton>
                      <IconButton label="Move later" disabled={pending || editing !== null || index === items.length - 1} onClick={() => run(() => moveContentItem(kind, item.id, 'down'), 'Order updated.')}><ArrowDown size={14} /></IconButton>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => { setNotice(''); setHighlight(null); requestEditor(item) }}
                        className="inline-flex h-10 items-center gap-2 border border-brand-line px-3 text-[10px] font-bold uppercase tracking-[0.12em] hover:border-brand-ink disabled:opacity-50"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        disabled={pending || editing !== null}
                        onClick={() => run(
                          () => setContentStatus(kind, item.id, item.status === 'published' ? 'draft' : 'published'),
                          item.status === 'published' ? 'Unpublished. It is hidden from the homepage.' : 'Published. It can appear on the homepage.',
                        )}
                        className="h-10 border border-brand-line px-3 text-[10px] font-bold uppercase tracking-[0.12em] hover:border-brand-ink disabled:opacity-50"
                      >
                        {item.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      {confirming === item.id ? (
                        <>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => {
                              setError('')
                              setNotice('')
                              void track((report) => finishSave(report, () => removeContent(kind, item.id))).then((result) => {
                                if (result.error) {
                                  setError(result.error)
                                  return
                                }
                                setConfirming(null)
                                setNotice(`${capitalize(noun)} deleted.`)
                                router.refresh()
                              }).catch(() => setError('The record could not be deleted.'))
                            }}
                            className="h-10 bg-red-800 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                          >
                            Delete
                          </button>
                          <button type="button" onClick={() => setConfirming(null)} className="h-10 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">Cancel</button>
                        </>
                      ) : (
                        <IconButton label="Delete" disabled={pending || editing !== null} onClick={() => setConfirming(item.id)}><Trash2 size={14} /></IconButton>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
  embedded,
  onDirty,
  onClose,
  onSaved,
}: {
  kind: 'activity' | 'gallery'
  item: ManagedContent | null
  embedded?: boolean
  onDirty: (dirty: boolean) => void
  onClose: () => void
  onSaved: (id: string | undefined, created: boolean) => void
}) {
  const matched = businesses.find((business) => business.slug === item?.slug) ?? businesses.find((business) => business.title.toLowerCase() === item?.category.toLowerCase())
  const initial = {
    slug: matched?.slug ?? businesses[0].slug,
    title: item?.title ?? '',
    body: item?.body ?? '',
    image: item?.image ?? '',
    status: item?.status ?? 'draft',
  }
  const [slug, setSlug] = useState<string>(initial.slug)
  const [title, setTitle] = useState(initial.title)
  const [body, setBody] = useState(initial.body)
  const [image, setImage] = useState(initial.image)
  const [status, setStatus] = useState(initial.status)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState(initial.image || '/mudogwaluyiira-hero.png')
  const [previewFailed, setPreviewFailed] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const { pending, track } = useAdminProgress()
  const noun = kind === 'activity' ? 'story' : 'image'
  const dirty = Boolean(file) || slug !== initial.slug || title !== initial.title || body !== initial.body || image !== initial.image || status !== initial.status
  const valid = title.trim().length >= 2 && (kind !== 'activity' || body.trim().length >= 2)

  useEffect(() => {
    onDirty(dirty)
    return () => onDirty(false)
  }, [dirty, onDirty])

  useEffect(() => {
    formRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, pending])

  useEffect(() => {
    if (!file) {
      setPreview(image.trim() || '/mudogwaluyiira-hero.png')
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file, image])

  useEffect(() => {
    setPreviewFailed(false)
  }, [preview])

  const hint = error
    ? error
    : !valid
      ? kind === 'activity' ? 'Add a title and the story before saving.' : 'Add a title before saving.'
      : dirty
        ? 'Unsaved changes.'
        : 'Drafts stay off the public homepage until you publish them.'

  return (
    <form
      ref={formRef}
      onSubmit={async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        if (!valid) {
          setError(kind === 'activity' ? 'Enter a title and the story.' : 'Enter a title.')
          return
        }
        const result = await track((report) => saveAdminForm(report, formData, saveContentItem))
        if (result.error) {
          setError(result.error)
          return
        }
        onSaved(result.id, !item)
      }}
      className={`scroll-mt-28 bg-white ${embedded ? '' : 'mt-6 border border-brand-ink'}`}
    >
      <div className="flex items-center justify-between border-b border-brand-line px-6 py-5">
        <h2 className="font-serif text-2xl">{item ? 'Edit' : 'New'} {noun}</h2>
        <button type="button" onClick={onClose} className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted hover:text-brand-ink">Cancel</button>
      </div>
      <div className="grid gap-5 p-6 lg:grid-cols-[240px_1fr]">
        <div>
          {previewFailed ? (
            <div className="flex aspect-[4/3] items-center justify-center border border-dashed border-brand-line px-4 text-center text-sm text-brand-muted">Preview unavailable</div>
          ) : (
            <img src={preview} alt="" onError={() => setPreviewFailed(true)} className="aspect-[4/3] w-full border border-brand-line object-cover" />
          )}
          <p className="mt-2 text-xs leading-5 text-brand-muted">{file ? file.name : image.trim() ? 'Current image' : 'The default image is used until you add one.'}</p>
        </div>
        <div className="grid content-start gap-5">
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
            <input ref={titleRef} name="title" value={title} onChange={(event) => setTitle(event.target.value)} className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink" />
          </label>
          {kind === 'activity' && (
            <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
              Story
              <textarea name="body" value={body} onChange={(event) => setBody(event.target.value)} rows={4} className="border border-brand-line px-3 py-2 text-sm font-medium normal-case tracking-normal text-brand-ink" />
            </label>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
              Image address
              <input name="image_path" value={image} onChange={(event) => setImage(event.target.value)} placeholder="/mudogwaluyiira-hero.png" className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink" />
            </label>
            <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
              Or upload an image
              <input
                name="image"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const next = event.target.files?.[0] ?? null
                  if (next && (!next.type.startsWith('image/') || next.size > maxImageBytes)) {
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
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Visibility
            <select name="status" value={status} onChange={(event) => setStatus(event.target.value as 'draft' | 'published')} className="h-11 border border-brand-line bg-white px-3 text-sm font-medium normal-case tracking-normal text-brand-ink">
              <option value="draft">Draft, hidden from the homepage</option>
              <option value="published">Published on the homepage</option>
            </select>
          </label>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-brand-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs ${error ? 'text-red-700' : dirty ? 'text-brand-ink' : 'text-brand-muted'}`} role="status">{hint}</p>
        <button disabled={pending || !valid || !dirty} className="h-12 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90 disabled:opacity-60">{pending ? 'Saving…' : item ? 'Save changes' : `Add ${noun}`}</button>
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

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
