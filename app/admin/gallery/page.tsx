import { AdminPageHeader } from '@/components/admin/admin-page'
import { ContentManager } from '@/components/admin/content-manager'
import { getManagedContent } from '@/lib/data'

export default async function GalleryPage() {
  const items = await getManagedContent('gallery')

  return (
    <>
      <AdminPageHeader
        eyebrow="Public website"
        title="Gallery"
        description="Add, replace and publish the images shown in the company gallery on the homepage."
      />
      <ContentManager kind="gallery" items={items ?? []} unavailable={items === null} />
    </>
  )
}
