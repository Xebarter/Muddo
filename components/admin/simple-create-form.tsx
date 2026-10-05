'use client'

import { useState, type ReactNode } from 'react'

export function SimpleCreateForm({
  action,
  fields,
  submitLabel,
  children,
}: {
  action: (formData: FormData) => Promise<{ error?: string }>
  fields: { name: string; label: string; type?: string }[]
  submitLabel: string
  children?: ReactNode
}) {
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  return (
    <form
      action={async (formData) => {
        const result = await action(formData)
        if (result?.error) {
          setError(result.error)
          setDone(false)
          return
        }
        setError('')
        setDone(true)
      }}
      className="mt-8 grid gap-4 border border-brand-line bg-white p-6 sm:grid-cols-2"
    >
      {fields.map((field) => (
        <label key={field.name} className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
          {field.label}
          {field.type === 'textarea' ? (
            <textarea name={field.name} required rows={3} className="border border-brand-line px-3 py-2 text-sm font-medium normal-case tracking-normal text-brand-ink" />
          ) : (
            <input name={field.name} type={field.type ?? 'text'} required={field.type !== 'number'} className="h-11 border border-brand-line px-3 text-sm font-medium normal-case tracking-normal text-brand-ink" />
          )}
        </label>
      ))}
      {children}
      <div className="flex items-end">
        <button className="h-11 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90">{submitLabel}</button>
      </div>
      {error && <p className="text-sm text-red-700 sm:col-span-2">{error}</p>}
      {done && <p className="text-sm text-brand-muted sm:col-span-2">Saved.</p>}
    </form>
  )
}
