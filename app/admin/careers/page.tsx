import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page'
import { JobManager } from '@/components/admin/job-manager'
import { getJobApplications, getManagedJobs } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Careers | Admin | Mudogwaluyiira Group',
}

export default async function AdminCareersPage() {
  const [jobs, applications] = await Promise.all([getManagedJobs(), getJobApplications()])
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
          : `${open} published ${open === 1 ? 'role' : 'roles'}. ${fresh} new ${fresh === 1 ? 'application' : 'applications'}.`}
      />
      <JobManager jobs={jobs ?? []} applications={applications ?? []} unavailable={unavailable} />
    </>
  )
}
