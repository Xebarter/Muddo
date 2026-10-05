import { AdminPageHeader } from '@/components/admin/admin-page'
import { ContentManager } from '@/components/admin/content-manager'
import { HeroImageForm } from '@/components/admin/hero-image-form'
import { getHomepageHero, getManagedContent } from '@/lib/data'

export default async function HomepageContentPage() {
  const [items, hero] = await Promise.all([getManagedContent('activity'), getHomepageHero()])

  return (
    <>
      <AdminPageHeader
        eyebrow="Public website"
        title="Homepage"
        description="Set the hero image, then write, reorder and publish the stories that introduce each business."
      />
      <HeroImageForm image={hero.image} unavailable={hero.unavailable} />
      <ContentManager kind="activity" items={items ?? []} unavailable={items === null} />
    </>
  )
}
