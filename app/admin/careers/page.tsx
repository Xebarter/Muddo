import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page'
import { JobManager } from '@/components/admin/job-manager'
import { getJobApplications, getManagedJobs, getSiteSettings } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Careers | Admin | Mudogwaluyiira Group',
}

export default async function AdminCareersPage() {
  const [jobs, applications, settings] = await Promise.all([getManagedJobs(), getJobApplications(), getSiteSettings()])
  const unavailable = jobs === null || applications === null
  const open = jobs?.filter((item) => item.status === 'published').length ?? 0
  const fresh = applications?.filter((item) => item.rawStatus === 'new').length ?? 0

  return (
    <>
      <AdminPageHeader
        eyebrow="People"
        title="Careers"
        description={unavailable
          ? 'Post roles and read applications from the public careers page.'
          : `${open} published ${open === 1 ? 'role' : 'roles'}. ${fresh} new ${fresh === 1 ? 'application' : 'applications'}. New applications are for ${settings.notificationEmail}.`}
      />
      <JobManager jobs={jobs ?? []} applications={applications ?? []} unavailable={unavailable} defaultLocation={settings.address} />
    </>
  )
}
