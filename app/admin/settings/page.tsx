import { AdminPageHeader } from '@/components/admin/admin-page'
import { SettingsForm } from '@/components/admin/settings-form'
import { getSiteSettings } from '@/lib/data'

export default async function SettingsPage() {
  const settings = await getSiteSettings()

  return (
    <>
      <AdminPageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Set the workspace identity, the contact details on the public site, and the inbox for new messages and applications."
      />
      <SettingsForm settings={settings} />
    </>
  )
}
