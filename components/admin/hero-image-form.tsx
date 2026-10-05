'use client'

import { useState } from 'react'
import { saveHeroImage } from '@/lib/actions'

export function HeroImageForm({ image, unavailable }: { image: string; unavailable?: boolean }) {
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  if (unavailable) {
    return (
      <p className="mt-8 border border-dashed border-brand-line bg-white px-6 py-8 text-sm text-brand-muted">
        The hero image setting is not ready. Run the Supabase script, then refresh.
      </p>
    )
  }

  return (
    <form
      action={async (formData) => {
        setPending(true)
        setSaved(false)
        const result = await saveHeroImage(formData)
        setPending(false)
        if (result.error) {
          setError(result.error)
          return
        }
        setError('')
        setSaved(true)
      }}
      className="mt-8 border border-brand-line bg-white"
    >
      <div className="border-b border-brand-line px-6 py-5">
        <h2 className="font-serif text-2xl">Hero image</h2>
        <p className="mt-2 text-sm text-brand-muted">The large image at the top of the homepage.</p>
      </div>
      <div className="grid gap-5 p-6 lg:grid-cols-[280px_1fr]">
        <img src={image} alt="" className="aspect-[16/9] w-full border border-brand-line object-cover" />
        <div className="grid content-start gap-5">
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Image address
            <input name="image_path" defaultValue={image} className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink" />
          </label>
          <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Or upload an image
            <input name="image" type="file" accept="image/*" className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink file:mr-3 file:border-0 file:bg-transparent file:text-[10px] file:font-bold file:uppercase file:tracking-[0.12em]" />
          </label>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-brand-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-brand-muted" role="status">{error || (saved ? 'Saved.' : 'Upload replaces the address.')}</p>
        <button type="submit" disabled={pending} className="h-12 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90 disabled:opacity-50">
          {pending ? 'Saving…' : 'Save hero'}
        </button>
      </div>
    </form>
  )
}
