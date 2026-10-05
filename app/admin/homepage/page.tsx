import { AdminPageHeader } from '@/components/admin/admin-page'
import { ContentManager } from '@/components/admin/content-manager'
import { getManagedContent } from '@/lib/data'

export default async function HomepageContentPage() {
  const items = await getManagedContent('activity')

  return (
    <>
      <AdminPageHeader
        eyebrow="Public website"
        title="Homepage stories"
        description="Write, reorder and publish the stories that introduce each business on the public homepage."
      />
      <ContentManager kind="activity" items={items ?? []} unavailable={items === null} />
    </>
  )
}
