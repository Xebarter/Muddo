import { AdminAction, AdminPageHeader, RecordGrid } from '@/components/admin/admin-page'

const activities = [
  'Hero image · Professionals reviewing construction plans · Published',
  'Construction · We build places that move Uganda forward · Published',
  'Education · We create environments where people learn · Published',
  'Financial services · We make progress more accessible · Published',
  'Talent development · We develop the people behind the potential · Published',
  'Events management · We bring people together with purpose · Published',
]

export default function HomepageContentPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Public website"
        title="Homepage activity showcase"
        description="Control the hero image, activity stories and calls to action that introduce every business division to the public."
        action={<AdminAction>Add activity</AdminAction>}
      />
      <RecordGrid rows={activities} />
    </>
  )
}
