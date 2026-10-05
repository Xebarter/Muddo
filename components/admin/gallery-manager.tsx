'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { finishSave, useAdminProgress } from '@/components/admin/save-progress'
import type { GalleryImageUse } from '@/lib/gallery-uses'
import type { AdminGalleryPhoto } from '@/lib/data'

const maxImageBytes = 5_000_000

function placeName(use: GalleryImageUse) {
  if (use.kind === 'hero') return 'the homepage hero'
  if (use.kind === 'service') return `the service “${use.label}”`
  if (use.kind === 'photo') return 'another gallery photo'
  return `the What we do story “${use.label}”`
}

export function GalleryManager({
  stories,
  uploads,
}: {
  stories: AdminGalleryPhoto[]
  uploads: AdminGalleryPhoto[]
}) {
  const router = useRouter()
  const addRef = useRef<HTMLInputElement>(null)
  const editRef = useRef<HTMLInputElement>(null)
  const editing = useRef<AdminGalleryPhoto | null>(null)
  const { pending, track } = useAdminProgress()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirming, setConfirming] = useState<string | null>(null)
  const [blocked, setBlocked] = useState<AdminGalleryPhoto | null>(null)

  const addPhotos = (list: FileList | null) => {
    const files = [...(list ?? [])]
    if (addRef.current) addRef.current.value = ''
    if (files.length === 0) return
    const invalid = files.find((file) => !file.type.startsWith('image/') || file.size > maxImageBytes)
    if (invalid) {
      setNotice('')
      setError('Choose images under 5 MB.')
      return
    }
    setError('')
    setNotice('')
    void track((report) => finishSave(report, async () => {
      for (let index = 0; index < files.length; index += 1) {
        const body = new FormData()
        body.set('image', files[index])
        const response = await fetch('/api/admin/gallery', { method: 'POST', body })
        const payload = await response.json().catch(() => ({})) as { error?: string }
        if (!response.ok) return { error: payload.error || 'The photo could not be added.' }
        report(((index + 1) / files.length) * 100)
      }
      return {}
    })).then((result) => {
      if (result.error) {
        setError(result.error)
        return
      }
      setNotice(files.length === 1 ? 'Photo added.' : `${files.length} photos added.`)
      router.refresh()
    }).catch(() => setError('The photo could not be added.'))
  }

  const replacePhoto = (list: FileList | null) => {
    const photo = editing.current
    const file = list?.[0]
    if (editRef.current) editRef.current.value = ''
    editing.current = null
    if (!photo || !file) return
    if (!file.type.startsWith('image/') || file.size > maxImageBytes) {
      setNotice('')
      setError('Choose an image under 5 MB.')
      return
    }
    setError('')
    setNotice('')
    setConfirming(null)
    setBlocked(null)
    const body = new FormData()
    body.set('id', photo.id)
    body.set('source', photo.source)
    body.set('image', file)
    void track((report) => finishSave(report, async () => {
      const response = await fetch('/api/admin/gallery', { method: 'PATCH', body })
      const payload = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) return { error: payload.error || 'The photo could not be updated.' }
      report(100)
      return {}
    })).then((result) => {
      if (result.error) {
        setError(result.error)
        return
      }
      setNotice('Photo updated.')
      router.refresh()
    }).catch(() => setError('The photo could not be updated.'))
  }

  const removePhoto = (id: string) => {
    setError('')
    setNotice('')
    void track((report) => finishSave(report, async () => {
      const response = await fetch('/api/admin/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const payload = await response.json().catch(() => ({})) as { error?: string; uses?: GalleryImageUse[] }
      if (response.status === 409 && payload.uses?.length) {
        return { error: 'used', uses: payload.uses }
      }
      if (!response.ok) return { error: payload.error || 'The photo could not be removed.' }
      report(100)
      return {}
    })).then((result) => {
      if ('uses' in result && result.uses?.length) {
        const photo = uploads.find((item) => item.id === id)
        setConfirming(null)
        setBlocked(photo ? { ...photo, uses: result.uses } : { id, source: 'upload', image: '', label: 'Gallery photo', uses: result.uses })
        return
      }
      if (result.error) {
        setError(result.error)
        return
      }
      setConfirming(null)
      setNotice('Photo removed.')
      router.refresh()
    }).catch(() => setError('The photo could not be removed.'))
  }

  const askRemove = (photo: AdminGalleryPhoto) => {
    setError('')
    setNotice('')
    if (photo.uses.length > 0) {
      setConfirming(null)
      setBlocked(photo)
      return
    }
    setBlocked(null)
    setConfirming(photo.id)
  }

  return (
    <div className="mt-8">
      <input ref={addRef} type="file" accept="image/*" multiple className="sr-only" onChange={(event) => addPhotos(event.target.files)} />
      <input ref={editRef} type="file" accept="image/*" className="sr-only" onChange={(event) => replacePhoto(event.target.files)} />
      {notice && <p className="border border-[#dce9df] bg-[#f3f8f4] px-4 py-3 text-sm text-[#28704d]" role="status">{notice}</p>}
      {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}

      <section className="mt-6">
        <h2 className="font-serif text-2xl">From What we do</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-brand-muted">These photos lead the gallery. Edit replaces the story photo. Delete opens the story when that photo is still in use.</p>
        {stories.length === 0 ? (
          <p className="mt-5 border border-dashed border-brand-line bg-white px-6 py-10 text-sm text-brand-muted">No What we do photos yet. Add a story image on Homepage.</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {stories.map((photo) => (
              <PhotoCard key={`story-${photo.id}`} photo={photo} pending={pending} confirming={confirming} onEdit={() => { editing.current = photo; editRef.current?.click() }} onAskRemove={() => askRemove(photo)} onRemove={() => removePhoto(photo.id)} onCancel={() => setConfirming(null)} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-serif text-2xl">More photos</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-brand-muted">Extra photos appear after the What we do images. A photo that is still used elsewhere opens that page instead of being deleted.</p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => addRef.current?.click()}
            className="inline-flex h-12 items-center justify-center gap-2 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90 disabled:opacity-50"
          >
            <Plus size={15} /> Add photos
          </button>
        </div>
        {uploads.length === 0 ? (
          <p className="mt-5 border border-dashed border-brand-line bg-white px-6 py-16 text-center text-sm text-brand-muted">No extra photos yet.</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {uploads.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} pending={pending} confirming={confirming} onEdit={() => { editing.current = photo; editRef.current?.click() }} onAskRemove={() => askRemove(photo)} onRemove={() => removePhoto(photo.id)} onCancel={() => setConfirming(null)} />
            ))}
          </div>
        )}
      </section>

      {blocked && <UsedElsewhere photo={blocked} onClose={() => setBlocked(null)} />}
    </div>
  )
}

function PhotoCard({
  photo,
  pending,
  confirming,
  onEdit,
  onAskRemove,
  onRemove,
  onCancel,
}: {
  photo: AdminGalleryPhoto
  pending: boolean
  confirming: string | null
  onEdit: () => void
  onAskRemove: () => void
  onRemove: () => void
  onCancel: () => void
}) {
  const open = confirming === photo.id
  return (
    <div className="border border-brand-line bg-white">
      <div className="relative aspect-square overflow-hidden">
        <img src={photo.image} alt="" className="size-full object-cover" />
        {open && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#101c17]/80 px-3 text-center">
            <p className="text-sm text-white">Remove this photo?</p>
            <div className="flex gap-2">
              <button type="button" disabled={pending} onClick={onRemove} className="h-10 bg-red-800 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">Remove</button>
              <button type="button" onClick={onCancel} className="h-10 border border-white/40 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Cancel</button>
            </div>
          </div>
        )}
      </div>
      {photo.source === 'story' && <p className="truncate px-3 pt-3 text-sm text-brand-ink">{photo.label}</p>}
      <div className="flex gap-2 p-3">
        <button type="button" disabled={pending} onClick={onEdit} className="inline-flex h-10 flex-1 items-center justify-center gap-2 border border-brand-line text-[10px] font-bold uppercase tracking-[0.12em] hover:border-brand-ink disabled:opacity-50">
          <Pencil size={14} /> Edit
        </button>
        <button type="button" disabled={pending} onClick={onAskRemove} className="inline-flex h-10 flex-1 items-center justify-center gap-2 border border-brand-line text-[10px] font-bold uppercase tracking-[0.12em] text-red-800 hover:border-red-800 disabled:opacity-50" aria-label={photo.source === 'story' ? `Delete ${photo.label}` : 'Delete photo'}>
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  )
}

function UsedElsewhere({ photo, onClose }: { photo: AdminGalleryPhoto; onClose: () => void }) {
  const places = photo.uses.filter((use) => use.kind !== 'photo')
  const alsoHere = photo.uses.some((use) => use.kind === 'photo')
  const only = places.length === 1 ? places[0] : null

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101c17]/70 p-4" role="dialog" aria-modal="true" aria-labelledby="gallery-used-title" onClick={onClose}>
      <div className="w-full max-w-lg bg-white p-6" onClick={(event) => event.stopPropagation()}>
        <h2 id="gallery-used-title" className="font-serif text-2xl">This photo is in use</h2>
        {only ? (
          <p className="mt-3 text-sm leading-6 text-brand-muted">This photo is used by {placeName(only)}. Do you want to delete that? You’ll open its page, where you can edit or delete it.</p>
        ) : places.length > 1 ? (
          <p className="mt-3 text-sm leading-6 text-brand-muted">This photo is used in more than one place. Open the one you want to edit or delete.</p>
        ) : (
          <p className="mt-3 text-sm leading-6 text-brand-muted">Another photo on this page uses the same image. Replace or remove that copy before this one can be deleted.</p>
        )}
        {alsoHere && places.length > 0 && <p className="mt-3 text-sm leading-6 text-brand-muted">Another photo on this page uses the same image too.</p>}
        {places.length > 1 && (
          <ul className="mt-4 grid gap-2">
            {places.map((use) => (
              <li key={`${use.kind}-${use.id}`}>
                <a href={use.href} className="flex min-h-11 items-center justify-between gap-3 border border-brand-line px-3 text-sm hover:border-brand-ink">
                  <span>{placeName(use)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em]">Open</span>
                </a>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-11 border border-brand-line px-4 text-[10px] font-bold uppercase tracking-[0.12em]">Cancel</button>
          {only && (
            <a href={only.href} className="inline-flex h-11 items-center justify-center bg-brand-ink px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Yes, open it</a>
          )}
        </div>
      </div>
    </div>
  )
}
