import { AdminPageHeader } from '@/components/admin/admin-page'
import { SettingsForm } from '@/components/admin/settings-form'
import { getAdminSnapshot } from '@/lib/data'

export default async function SettingsPage() {
  const snapshot = await getAdminSnapshot()

  return (
    <>
      <AdminPageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Review the operations workspace details used across the admin."
      />
      <SettingsForm settings={snapshot?.settings ?? {
        workspace_name: 'Mudogwaluyiira operations',
        contact_name: 'Admin Manager',
        role_label: 'Operations',
        notification_email: 'operations@mudogwaluyiira.ug',
      }} />
    </>
  )
}
