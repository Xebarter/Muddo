import { AdminPageHeader, RecordGrid } from '@/components/admin/admin-page'
import { SimpleCreateForm } from '@/components/admin/simple-create-form'
import { createGalleryItem } from '@/lib/actions'
import { getAdminSnapshot } from '@/lib/data'

const fallback = [
  'Site progress at Kampala Heights · Construction · Published',
  'Learning spaces for brighter futures · Education · Published',
  'People, purpose and possibility · Talent development · Published',
  'Events that bring communities together · Events management · Published',
]

export default async function GalleryPage() {
  const snapshot = await getAdminSnapshot()

  return (
    <>
      <AdminPageHeader
        eyebrow="Public website"
        title="Gallery management"
        description="Add the images that showcase construction, education, talent, events and corporate activity on the homepage."
      />
      <RecordGrid rows={snapshot?.gallery ?? fallback} />
      <SimpleCreateForm
        action={createGalleryItem}
        submitLabel="Add image"
        fields={[
          { name: 'title', label: 'Title' },
          { name: 'category', label: 'Category' },
        ]}
      />
    </>
  )
}
