import { AdminAction, AdminPageHeader } from '@/components/admin/admin-page'

const fields = [
  { label: 'Workspace name', value: 'Mudogwaluyiira operations' },
  { label: 'Primary contact', value: 'Admin Manager' },
  { label: 'Role', value: 'Operations' },
  { label: 'Notification email', value: 'operations@mudogwaluyiira.ug' },
]

export default function SettingsPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Review the operations workspace details used across the admin."
        action={<AdminAction>Save changes</AdminAction>}
      />
      <section className="mt-8 border border-brand-line bg-white">
        <div className="divide-y divide-brand-line">
          {fields.map((field) => (
            <div key={field.label} className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">{field.label}</p>
              <p className="text-sm font-semibold">{field.value}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
