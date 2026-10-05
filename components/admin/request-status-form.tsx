'use client'

import { type FormEvent } from 'react'
import { finishSave, useAdminProgress } from '@/components/admin/save-progress'
import { updateRequestStatus } from '@/lib/actions'

const statuses = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'converted', label: 'Converted' },
  { value: 'closed', label: 'Closed' },
]

export function RequestStatusForm({ id, status }: { id: string; status: string }) {
  const { pending, track } = useAdminProgress()

  return (
    <form
      onSubmit={async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        await track((report) => finishSave(report, () => updateRequestStatus(formData)))
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`status-${id}`}>Status</label>
      <select id={`status-${id}`} name="status" defaultValue={status} className="h-9 border border-brand-line bg-white px-2 text-xs text-brand-ink">
        {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <button disabled={pending} className="h-9 bg-brand-ink px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">Update</button>
    </form>
  )
}
