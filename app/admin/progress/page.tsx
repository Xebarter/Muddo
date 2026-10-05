import { AdminPageHeader } from '@/components/admin/admin-page'
import { ProgressDesk } from '@/components/admin/progress-desk'
import { getProgressDesk } from '@/lib/data'
import { todayInKampala } from '@/lib/format'

export default async function ProgressPage() {
  const desk = await getProgressDesk()

  return (
    <>
      <AdminPageHeader
        eyebrow="Customer delivery"
        title="Progress centre"
        description="Publish an update, correct it, or remove it. The latest update sets the progress customers see on their service."
      />
      <ProgressDesk desk={desk} today={todayInKampala()} />
    </>
  )
}
