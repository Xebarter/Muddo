import { AdminPageHeader } from '@/components/admin/admin-page'
import { ContentManager } from '@/components/admin/content-manager'
import { HeroImageForm } from '@/components/admin/hero-image-form'
import { getHomepageHero, getManagedContent } from '@/lib/data'

export default async function HomepageContentPage({
  searchParams,
}: {
  searchParams: Promise<{ story?: string | string[] }>
}) {
  const story = (await searchParams).story
  const focusId = typeof story === 'string' ? story : undefined
  const [items, hero] = await Promise.all([getManagedContent('activity'), getHomepageHero()])

  return (
    <>
      <AdminPageHeader
        eyebrow="Public website"
        title="What we Do"
        description="Set the hero image, then write, reorder and publish the stories that introduce each business. Published stories appear on What we do and on the homepage."
        action={
          <a href="/what-we-do" target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center border border-brand-line bg-white px-5 text-xs font-bold uppercase tracking-[0.12em] hover:border-brand-ink">
            View page
          </a>
        }
      />
      <HeroImageForm image={hero.image} unavailable={hero.unavailable} />
      <ContentManager kind="activity" items={items ?? []} unavailable={items === null} focusId={focusId} />
    </>
  )
}
