import type { Metadata } from 'next'
import { PhotoGallery } from '@/components/site/photo-gallery'
import { PublicSite } from '@/components/site/public-site'
import { getGalleryPhotos } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Gallery | Mudogwaluyiira Group of Companies',
  description: 'Photographs of Mudogwaluyiira Group of Companies at work across Uganda.',
}

export default async function GalleryPage() {
  const gallery = await getGalleryPhotos()
  const photos = gallery?.photos ?? []

  return (
    <PublicSite>
      <section className="bg-[#15251f] px-5 pb-12 pt-36 text-white lg:px-8 lg:pb-16 lg:pt-44">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow text-[#d9bb7d]">Gallery</p>
          <h1 className="section-title max-w-3xl text-white">A closer look<br /><span className="text-[#d9bb7d]">at our work.</span></h1>
        </div>
      </section>
      <section className="bg-[#f7f7f5] px-5 py-8 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          {photos.length === 0 ? (
            <p className="border border-dashed border-[#d9ddd8] bg-white px-6 py-20 text-center text-sm text-[#65736d]">Photos will appear here.</p>
          ) : (
            <PhotoGallery photos={photos} />
          )}
        </div>
      </section>
    </PublicSite>
  )
}
