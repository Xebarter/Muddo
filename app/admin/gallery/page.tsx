import { AdminPageHeader } from '@/components/admin/admin-page'
import { GalleryManager } from '@/components/admin/gallery-manager'
import { getGalleryPhotos } from '@/lib/data'

export default async function AdminGalleryPage() {
  const gallery = await getGalleryPhotos()

  return (
    <>
      <AdminPageHeader
        eyebrow="Public website"
        title="Gallery"
        description="The public gallery is photos only. What we do images are shown first. Upload any other photos here."
      />
      {gallery === null ? (
        <p className="mt-8 border border-dashed border-brand-line bg-white px-6 py-16 text-center text-sm text-brand-muted">The gallery is not ready. Run the Supabase script, then refresh.</p>
      ) : (
        <GalleryManager work={gallery.work} uploads={gallery.uploads} />
      )}
    </>
  )
}
