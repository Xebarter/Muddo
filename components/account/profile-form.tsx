'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useProfile, type Profile } from '@/components/account/profile-context'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ProfileForm() {
  const { profile, role, saveProfile } = useProfile()
  const [draft, setDraft] = useState<Profile>(profile)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof Profile, string>>>({})

  useEffect(() => {
    setDraft(profile)
  }, [profile])

  const update = (key: keyof Profile, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next = {
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      location: draft.location.trim(),
    }
    const nextErrors: Partial<Record<keyof Profile, string>> = {}
    if (next.name.length < 2) nextErrors.name = 'Enter your full name.'
    if (next.email && !emailPattern.test(next.email)) nextErrors.email = 'Enter a valid email address.'
    if (next.phone.length < 7) nextErrors.phone = 'Enter a phone number.'
    if (next.location.length < 2) nextErrors.location = 'Enter your location.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    const result = await saveProfile(next)
    if (result.error) {
      setErrors({ name: result.error })
      setSaved(false)
      return
    }
    setDraft(next)
    setSaved(true)
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-2xl border border-brand-line bg-white" noValidate>
      <div className="flex items-center gap-4 border-b border-brand-line p-6">
        <img src="/placeholder-user.jpg" alt="" width={56} height={56} className="size-14 border border-brand-line object-cover" />
        <div>
          <p className="text-sm font-semibold">{draft.name.trim() || 'Your name'}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-muted">{role}</p>
        </div>
      </div>
      <div className="grid gap-5 p-6">
        <Field label="Full name" name="name" value={draft.name} error={errors.name} onChange={(value) => update('name', value)} autoComplete="name" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" name="email" type="email" value={draft.email} error={errors.email} onChange={(value) => update('email', value)} autoComplete="email" readOnly />
          <Field label="Phone" name="phone" type="tel" value={draft.phone} error={errors.phone} onChange={(value) => update('phone', value)} autoComplete="tel" />
        </div>
        <Field label="Location" name="location" value={draft.location} error={errors.location} onChange={(value) => update('location', value)} autoComplete="address-level2" />
      </div>
      <div className="flex flex-col gap-3 border-t border-brand-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-brand-muted" role="status">{saved ? 'Profile saved. Your account now uses these details.' : 'Changes apply across your account after you save.'}</p>
        <button type="submit" className="inline-flex h-12 items-center justify-center bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90">Save profile</button>
      </div>
    </form>
  )
}

function Field({
  label,
  name,
  value,
  error,
  onChange,
  type = 'text',
  autoComplete,
  readOnly,
}: {
  label: string
  name: string
  value: string
  error?: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
  readOnly?: boolean
}) {
  const id = `profile-${name}`
  return (
    <label htmlFor={id} className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">{label}</span>
      <input id={id} name={name} type={type} value={value} readOnly={readOnly} autoComplete={autoComplete} onChange={(event) => onChange(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} className="field mt-2 read-only:bg-brand-surface" />
      {error && <span id={`${id}-error`} className="mt-2 block text-xs text-brand-gold-deep">{error}</span>}
    </label>
  )
}
