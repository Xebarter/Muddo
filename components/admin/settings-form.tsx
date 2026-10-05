'use client'

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { finishSave, useAdminProgress } from '@/components/admin/save-progress'
import { saveWorkspaceSettings } from '@/lib/actions'
import type { WorkspaceSettings } from '@/lib/data'

export function SettingsForm({ settings }: { settings: WorkspaceSettings }) {
  const router = useRouter()
  const [values, setValues] = useState(settings)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const { pending, track } = useAdminProgress()
  const stamp = JSON.stringify(settings)

  useEffect(() => {
    setValues(settings)
  }, [stamp, settings])

  const set = (key: keyof WorkspaceSettings) => (event: { target: { value: string } }) => {
    setSaved(false)
    setError('')
    setValues((current) => ({ ...current, [key]: event.target.value }))
  }

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
        router.refresh()
      }}
      className="mt-8 grid gap-6"
    >
      {!settings.contactReady && (
        <p className="border border-brand-line bg-white px-5 py-4 text-sm leading-6 text-brand-muted" role="status">
          Public contact details are not ready yet. Run supabase/0007site-settings.sql in the Supabase SQL editor, then refresh this page.
        </p>
      )}

      <Section title="Workspace" text="The name, person, and role shown in the admin header and sidebar.">
        <Field name="workspace_name" label="Workspace name" value={values.workspaceName} onChange={set('workspaceName')} />
        <Field name="contact_name" label="Primary contact" value={values.contactName} onChange={set('contactName')} />
        <Field name="role_label" label="Role" value={values.roleLabel} onChange={set('roleLabel')} />
      </Section>

      <Section title="Public contact" text="Phone, email, WhatsApp, and address on the website and the contact page.">
        <Field name="public_email" label="Public email" type="email" value={values.publicEmail} onChange={set('publicEmail')} />
        <Field name="phone" label="Phone" value={values.phone} onChange={set('phone')} placeholder="+256 787 703 725" />
        <Field name="whatsapp" label="WhatsApp" value={values.whatsapp} onChange={set('whatsapp')} placeholder="+256 787 703 725" hint="Use the same number as the phone, or a different WhatsApp number." />
        <Field name="address" label="Address" value={values.address} onChange={set('address')} />
        <Field name="hours" label="Opening hours" value={values.hours} onChange={set('hours')} placeholder="Mon–Fri, 8:00–17:00" hint="Optional. Shown on the contact page." required={false} />
      </Section>

      <Section title="Notifications" text="The inbox named on Messages and Careers for new contact messages and applications.">
        <Field name="notification_email" label="Notification email" type="email" value={values.notificationEmail} onChange={set('notificationEmail')} />
      </Section>

      <div className="flex flex-col gap-3 border border-brand-line bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs ${error ? 'text-red-700' : saved ? 'text-[#28704d]' : 'text-brand-muted'}`} role={error ? 'alert' : 'status'}>
          {error || (saved ? 'Settings saved. The site is using these details.' : 'Save to update the admin workspace and the public site.')}
        </p>
        <button disabled={pending} className="h-12 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

function Section({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <section className="border border-brand-line bg-white">
      <div className="border-b border-brand-line px-6 py-5">
        <h2 className="font-serif text-2xl">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-brand-muted">{text}</p>
      </div>
      <div className="grid gap-5 p-6">{children}</div>
    </section>
  )
}

function Field({
  name,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  required = true,
}: {
  name: string
  label: string
  value: string
  onChange: (event: { target: { value: string } }) => void
  type?: string
  placeholder?: string
  hint?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">{label}</span>
      <input name={name} type={type} required={required} value={value} placeholder={placeholder} onChange={onChange} className="field mt-2" />
      {hint && <span className="mt-2 block text-xs leading-5 text-brand-muted">{hint}</span>}
    </label>
  )
}
