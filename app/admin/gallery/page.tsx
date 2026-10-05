import { AdminPageHeader } from '@/components/admin/admin-page'
import { GalleryManager } from '@/components/admin/gallery-manager'
import { getAdminGallery } from '@/lib/data'

export default async function AdminGalleryPage() {
  const gallery = await getAdminGallery()

  return (
    <>
      <AdminPageHeader
        eyebrow="Public website"
        title="Gallery"
        description="The public gallery is photos only. What we do images are shown first. Edit a photo here, or upload others. A photo that is still used elsewhere opens the page where you can edit or delete that item."
      />
      {gallery === null ? (
        <p className="mt-8 border border-dashed border-brand-line bg-white px-6 py-16 text-center text-sm text-brand-muted">The gallery is not ready. Run the Supabase script, then refresh.</p>
      ) : (
        <GalleryManager stories={gallery.stories} uploads={gallery.uploads} />
      )}
    </>
  )
}
