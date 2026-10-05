import { AdminAction, AdminPageHeader, RecordGrid } from '@/components/admin/admin-page'

const images = [
  'Site progress at Kampala Heights · Construction · Published',
  'Learning spaces for brighter futures · Education · Published',
  'People, purpose and possibility · Talent development · Published',
  'Events that bring communities together · Events management · Published',
]

export default function GalleryPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Public website"
        title="Gallery management"
        description="Upload and curate the images that showcase construction, education, talent, events and corporate activity on the homepage."
        action={<AdminAction>Upload image</AdminAction>}
      />
      <RecordGrid rows={images} />
    </>
  )
}
