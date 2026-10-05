'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { finishSave, useAdminProgress } from '@/components/admin/save-progress'
import type { GalleryPhoto } from '@/lib/data'

const maxImageBytes = 5_000_000

export function GalleryManager({
  work,
  uploads,
}: {
  work: GalleryPhoto[]
  uploads: GalleryPhoto[]
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const { pending, track } = useAdminProgress()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirming, setConfirming] = useState<string | null>(null)

  const addPhotos = (list: FileList | null) => {
    const files = [...(list ?? [])]
    if (inputRef.current) inputRef.current.value = ''
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

  const removePhoto = (id: string) => {
    setError('')
    setNotice('')
    void track((report) => finishSave(report, async () => {
      const response = await fetch('/api/admin/content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'gallery', id }),
      })
      const payload = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) return { error: payload.error || 'The photo could not be removed.' }
      report(100)
      return {}
    })).then((result) => {
      if (result.error) {
        setError(result.error)
        return
      }
      setConfirming(null)
      setNotice('Photo removed.')
      router.refresh()
    }).catch(() => setError('The photo could not be removed.'))
  }

  return (
    <div className="mt-8">
      <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={(event) => addPhotos(event.target.files)} />
      {notice && <p className="border border-[#dce9df] bg-[#f3f8f4] px-4 py-3 text-sm text-[#28704d]" role="status">{notice}</p>}
      {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}

      <section className="mt-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-serif text-2xl">From What we do</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-brand-muted">These photos lead the gallery. They come from the homepage stories, so change them on Homepage.</p>
          </div>
        </div>
        {work.length === 0 ? (
          <p className="mt-5 border border-dashed border-brand-line bg-white px-6 py-10 text-sm text-brand-muted">No What we do photos yet. Add a story image on Homepage.</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {work.map((photo, index) => (
              <div key={photo.id} className="aspect-square overflow-hidden border border-brand-line bg-white">
                <img src={photo.image} alt="" className="size-full object-cover" />
                <span className="sr-only">What we do photo {index + 1}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-serif text-2xl">More photos</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-brand-muted">Upload extra photos. They appear after the What we do images.</p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-12 items-center justify-center gap-2 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90 disabled:opacity-50"
          >
            <Plus size={15} /> Add photos
          </button>
        </div>
        {uploads.length === 0 ? (
          <p className="mt-5 border border-dashed border-brand-line bg-white px-6 py-16 text-center text-sm text-brand-muted">No extra photos yet.</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {uploads.map((photo) => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden border border-brand-line bg-white">
                <img src={photo.image} alt="" className="size-full object-cover" />
                {confirming === photo.id ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#101c17]/80 px-3 text-center">
                    <p className="text-sm text-white">Remove this photo?</p>
                    <div className="flex gap-2">
                      <button type="button" disabled={pending} onClick={() => removePhoto(photo.id)} className="h-10 bg-red-800 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">Remove</button>
                      <button type="button" onClick={() => setConfirming(null)} className="h-10 border border-white/40 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setConfirming(photo.id)}
                    className="absolute right-2 top-2 flex size-10 items-center justify-center bg-[#101c17]/80 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
