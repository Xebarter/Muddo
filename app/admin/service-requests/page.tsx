import { AdminPageHeader } from '@/components/admin/admin-page'
import { RequestDesk } from '@/components/admin/request-desk'
import { getServiceRequests } from '@/lib/data'

export default async function ServiceRequestsPage() {
  const requests = await getServiceRequests()

  return (
    <>
      <AdminPageHeader
        eyebrow="Incoming work"
        title="Service requests"
        description="Record an enquiry, follow it from first contact to conversion, and remove it when it no longer belongs in the pipeline."
      />
      <RequestDesk requests={requests} />
    </>
  )
}
