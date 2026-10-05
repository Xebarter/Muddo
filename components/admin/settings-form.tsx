'use client'

import { useState, type FormEvent } from 'react'
import { finishSave, useAdminProgress } from '@/components/admin/save-progress'
import { saveWorkspaceSettings } from '@/lib/actions'

export function SettingsForm({
  settings,
}: {
  settings: { workspace_name: string; contact_name: string; role_label: string; notification_email: string }
}) {
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const { pending, track } = useAdminProgress()

  return (
    <form
      onSubmit={async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const result = await track((report) => finishSave(report, () => saveWorkspaceSettings(formData)))
        if (result.error) {
          setError(result.error)
          setSaved(false)
          return
        }
        setError('')
        setSaved(true)
      }}
      className="mt-8 border border-brand-line bg-white"
    >
      <div className="grid gap-5 p-6">
        <Field name="workspace_name" label="Workspace name" defaultValue={settings.workspace_name} />
        <Field name="contact_name" label="Primary contact" defaultValue={settings.contact_name} />
        <Field name="role_label" label="Role" defaultValue={settings.role_label} />
        <Field name="notification_email" label="Notification email" type="email" defaultValue={settings.notification_email} />
      </div>
      <div className="flex items-center justify-between border-t border-brand-line px-6 py-5">
        <p className="text-xs text-brand-muted">{error || (saved ? 'Settings saved.' : 'These details identify the operations workspace.')}</p>
        <button disabled={pending} className="h-12 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">Save changes</button>
      </div>
    </form>
  )
}

function Field({ name, label, defaultValue, type = 'text' }: { name: string; label: string; defaultValue: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">{label}</span>
      <input name={name} type={type} required defaultValue={defaultValue} className="field mt-2" />
    </label>
  )
}
