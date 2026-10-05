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
        action={
          <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center border border-brand-line bg-white px-5 text-xs font-bold uppercase tracking-[0.12em] hover:border-brand-ink">
            View homepage
          </a>
        }
      />
      <HeroImageForm image={hero.image} unavailable={hero.unavailable} />
      <ContentManager kind="activity" items={items ?? []} unavailable={items === null} />
    </>
  )
}
