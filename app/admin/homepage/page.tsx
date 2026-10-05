import { AdminPageHeader, RecordGrid } from '@/components/admin/admin-page'
import { SimpleCreateForm } from '@/components/admin/simple-create-form'
import { createActivity } from '@/lib/actions'
import { getAdminSnapshot } from '@/lib/data'

const fallback = [
  'Construction · We build places that move Uganda forward · Published',
  'Education · We create environments where people learn · Published',
  'Financial services · We make progress more accessible · Published',
  'Talent development · We develop the people behind the potential · Published',
  'Events management · We bring people together with purpose · Published',
]

export default async function HomepageContentPage() {
  const snapshot = await getAdminSnapshot()

  return (
    <>
      <AdminPageHeader
        eyebrow="Public website"
        title="Homepage activity showcase"
        description="Publish the activity stories that introduce every business division on the public homepage."
      />
      <RecordGrid rows={snapshot?.activities ?? fallback} />
      <SimpleCreateForm
        action={createActivity}
        submitLabel="Publish activity"
        fields={[
          { name: 'category', label: 'Category' },
          { name: 'title', label: 'Title' },
          { name: 'body', label: 'Story', type: 'textarea' },
        ]}
      />
    </>
  )
}
