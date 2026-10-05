'use client'

import { useEffect, useState } from 'react'
import { saveAdminForm, useAdminProgress } from '@/components/admin/save-progress'
import { saveHeroImage } from '@/lib/actions'

const maxImageBytes = 5_000_000

export function HeroImageForm({ image, unavailable }: { image: string; unavailable?: boolean }) {
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [path, setPath] = useState(image)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState(image)
  const [previewFailed, setPreviewFailed] = useState(false)
  const [fileInput, setFileInput] = useState(0)
  const { pending, track } = useAdminProgress()
  const dirty = Boolean(file) || path.trim() !== image

  useEffect(() => {
    setPath(image)
    setFile(null)
    setFileInput((value) => value + 1)
    setError('')
  }, [image])

  useEffect(() => {
    if (!file) {
      setPreview(path.trim() || image)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file, path, image])

  useEffect(() => {
    setPreviewFailed(false)
  }, [preview])

  if (unavailable) {
    return (
      <p className="mt-8 border border-dashed border-brand-line bg-white px-6 py-8 text-sm text-brand-muted">
        The hero image setting is not ready. Run the Supabase script, then refresh.
      </p>
    )
  }

  const status = error
    ? error
    : saved
      ? 'Saved. The homepage hero is updated.'
      : file
        ? 'This preview replaces the current hero when you save.'
        : dirty
          ? 'Save to use this image address.'
          : 'Shown across the top of the homepage. JPG, PNG, or WebP, up to 5 MB.'

  return (
    <form
      action={async (formData) => {
        setSaved(false)
        const result = await track((report) => saveAdminForm(report, formData, saveHeroImage))
        if (result.error) {
          setError(result.error)
          return
        }
        setError('')
        setSaved(true)
        setFile(null)
        setFileInput((value) => value + 1)
      }}
      className="mt-8 border border-brand-line bg-white"
    >
      <div className="border-b border-brand-line px-6 py-5">
        <h2 className="font-serif text-2xl">Hero image</h2>
        <p className="mt-2 text-sm text-brand-muted">The large photograph behind the homepage headline.</p>
      </div>
      <div className="grid gap-5 p-6 lg:grid-cols-[320px_1fr]">
        {previewFailed ? (
          <div className="flex aspect-[16/9] items-center justify-center border border-dashed border-brand-line px-4 text-center text-sm text-brand-muted">
            This address did not load a preview. You can still save it.
          </div>
        ) : (
          <img src={preview || image} alt="" onError={() => setPreviewFailed(true)} className="aspect-[16/9] w-full border border-brand-line object-cover" />
        )}
        <div className="grid content-start gap-5">
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Image address
            <input
              name="image_path"
              value={path}
              onChange={(event) => {
                setPath(event.target.value)
                setSaved(false)
                setError('')
              }}
              className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink"
            />
          </label>
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Or upload an image
            <input
              key={fileInput}
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
                setSaved(false)
                setFile(next)
              }}
              className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink file:mr-3 file:border-0 file:bg-transparent file:text-[10px] file:font-bold file:uppercase file:tracking-[0.12em]"
            />
          </label>
          {file && <p className="text-sm text-brand-ink">{file.name} will be used instead of the address.</p>}
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-brand-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs ${error ? 'text-red-700' : saved ? 'text-[#28704d]' : 'text-brand-muted'}`} role="status">{status}</p>
        <button type="submit" disabled={pending || !dirty} className="h-12 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90 disabled:opacity-50">
          {pending ? 'Saving…' : 'Save hero'}
        </button>
      </div>
    </form>
  )
}
