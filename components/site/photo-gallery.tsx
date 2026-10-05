'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { GalleryPhoto } from '@/lib/data'

export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const photo = open === null ? null : photos[open]

  useEffect(() => {
    if (open === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(null)
      if (event.key === 'ArrowRight') setOpen((current) => (current === null ? current : (current + 1) % photos.length))
      if (event.key === 'ArrowLeft') setOpen((current) => (current === null ? current : (current - 1 + photos.length) % photos.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, photos.length])

  if (photos.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpen(index)}
            className="aspect-square overflow-hidden bg-[#dfe5df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b48b45]"
            aria-label={`Open photo ${index + 1}`}
          >
            <img src={item.image} alt="" className="size-full object-cover transition duration-500 hover:scale-105" />
          </button>
        ))}
      </div>
      {photo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101c17]/90 p-4" role="dialog" aria-modal="true" aria-label="Gallery photo">
          <button type="button" onClick={() => setOpen(null)} className="absolute right-4 top-4 flex size-11 items-center justify-center text-white" aria-label="Close photo">
            <X />
          </button>
          {photos.length > 1 && (
            <button type="button" onClick={() => setOpen((open! - 1 + photos.length) % photos.length)} className="absolute left-3 flex size-11 items-center justify-center text-white sm:left-6" aria-label="Previous photo">
              <ChevronLeft />
            </button>
          )}
          <img src={photo.image} alt="" className="max-h-[85vh] max-w-[90vw] object-contain" />
          {photos.length > 1 && (
            <button type="button" onClick={() => setOpen((open! + 1) % photos.length)} className="absolute right-3 flex size-11 items-center justify-center text-white sm:right-6" aria-label="Next photo">
              <ChevronRight />
            </button>
          )}
        </div>
      )}
    </>
  )
}
