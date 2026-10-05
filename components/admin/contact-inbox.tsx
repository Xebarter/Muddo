'use client'

import { useState, type FormEvent } from 'react'
import { finishSave, useAdminProgress } from '@/components/admin/save-progress'
import { StatusBadge } from '@/components/site/design-system'
import { deleteContactMessage, updateContactMessage } from '@/lib/actions'
import type { ContactMessage } from '@/lib/data'

const statuses = [
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
]

export function ContactInbox({ messages, unavailable }: { messages: ContactMessage[]; unavailable?: boolean }) {
  const [error, setError] = useState('')
  const { pending, track } = useAdminProgress()

  if (unavailable) {
    return (
      <p className="mt-8 border border-dashed border-brand-line bg-white px-6 py-8 text-sm text-brand-muted">
        Contact messages are not ready. Run the latest Supabase script, then refresh.
      </p>
    )
  }

  return (
    <section className="mt-8 border border-brand-line bg-white">
      <div className="border-b border-brand-line p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">Inbox</p>
        <h2 className="mt-2 font-serif text-2xl">Messages from the contact page</h2>
      </div>
      {error && <p className="border-b border-brand-line px-6 py-4 text-sm text-red-700" role="alert">{error}</p>}
      {messages.length === 0 ? (
        <p className="px-6 py-16 text-center text-sm text-brand-muted">No messages yet. They will appear here when someone writes from the contact page.</p>
      ) : (
        <ol className="divide-y divide-brand-line">
          {messages.map((message) => (
            <li key={message.id} className="grid gap-4 p-6 lg:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold">{message.name}</p>
                  <StatusBadge tone={message.tone}>{message.status}</StatusBadge>
                  <span className="text-xs text-brand-muted">{message.date}</span>
                </div>
                <p className="mt-2 font-serif text-2xl leading-tight">{message.subject}</p>
                <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-brand-muted">{message.message}</p>
                <p className="mt-3 text-xs text-brand-muted">
                  <a href={`mailto:${message.email}`} className="underline decoration-brand-line underline-offset-4">{message.email}</a>
                  {message.phone ? ` · ${message.phone}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-2 lg:flex-col lg:items-stretch">
                <form
                  onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault()
                    const formData = new FormData(event.currentTarget)
                    setError('')
                    const result = await track((report) => finishSave(report, () => updateContactMessage(formData)))
                    if (result.error) setError(result.error)
                  }}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="id" value={message.id} />
                  <label className="sr-only" htmlFor={`message-status-${message.id}`}>Status</label>
                  <select id={`message-status-${message.id}`} name="status" defaultValue={message.rawStatus} className="h-10 border border-brand-line bg-white px-2 text-xs text-brand-ink">
                    {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  <button disabled={pending} className="h-10 bg-brand-ink px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">Update</button>
                </form>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setError('')
                    void track((report) => finishSave(report, () => deleteContactMessage(message.id))).then((result) => {
                      if (result.error) setError(result.error)
                    })
                  }}
                  className="h-10 border border-brand-line px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-red-800 hover:border-red-800 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
