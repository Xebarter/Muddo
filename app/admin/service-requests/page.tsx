import { MoreHorizontal } from 'lucide-react'
import { StatusBadge } from '@/components/site/design-system'
import { AdminAction, AdminPageHeader, RecordGrid } from '@/components/admin/admin-page'

const pipeline = [
  'MG-REQ-0008 · Sarah Nakato · New',
  'MG-REQ-0007 · Kato & Sons Ltd · Reviewing',
  'MG-REQ-0006 · Grace Achieng · New',
]

const requests = [
  { name: 'Sarah Nakato', service: 'House construction', location: 'Kampala', date: 'Today, 09:42', status: 'New', tone: 'gold' as const },
  { name: 'Kato & Sons Ltd', service: 'Corporate event', location: 'Entebbe', date: 'Yesterday', status: 'Reviewing', tone: 'muted' as const },
  { name: 'Grace Achieng', service: 'Talent development', location: 'Jinja', date: '06 Oct 2026', status: 'New', tone: 'gold' as const },
  { name: 'Mirembe Schools', service: 'Education development', location: 'Mukono', date: '05 Oct 2026', status: 'Contacted', tone: 'green' as const },
]

export default function ServiceRequestsPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Incoming work"
        title="Request pipeline"
        description="Qualify new enquiries, assign owners and turn the right opportunities into services."
        action={<AdminAction>Export requests</AdminAction>}
      />
      <RecordGrid rows={pipeline} />
      <section className="mt-8 border border-brand-line bg-white">
        <div className="border-b border-brand-line p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">Incoming work</p>
          <h2 className="mt-2 font-serif text-2xl">Service requests</h2>
        </div>
        <div className="divide-y divide-brand-line">
          {requests.map((request) => (
            <div key={request.name} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex size-10 items-center justify-center bg-brand-surface text-sm font-semibold">{request.name.split(' ').map((part) => part[0]).join('')}</span>
                <div>
                  <p className="text-sm font-semibold">{request.name}</p>
                  <p className="mt-1 text-xs text-brand-muted">{request.service} · {request.location}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-5 sm:justify-end">
                <p className="text-xs text-brand-muted">{request.date}</p>
                <StatusBadge tone={request.tone}>{request.status}</StatusBadge>
                <button aria-label={`More options for ${request.name}`} className="text-brand-muted hover:text-brand-ink"><MoreHorizontal size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
