import { OperationsDashboard } from '@/components/admin/operations-dashboard'
import { getAdminSnapshot } from '@/lib/data'

const fallbackRequests = [
  { name: 'Sarah Nakato', service: 'House construction', location: 'Kampala', date: 'Today, 09:42', status: 'New', tone: 'gold' as const },
  { name: 'Kato & Sons Ltd', service: 'Corporate event', location: 'Entebbe', date: 'Yesterday', status: 'Reviewing', tone: 'muted' as const },
  { name: 'Grace Achieng', service: 'Talent development', location: 'Jinja', date: '06 Oct 2026', status: 'New', tone: 'gold' as const },
  { name: 'Mirembe Schools', service: 'Education development', location: 'Mukono', date: '05 Oct 2026', status: 'Contacted', tone: 'green' as const },
]

const fallbackPayments = [
  { customer: 'John Doe', service: 'Residential construction', amount: 'UGX 20,000,000', date: '04 Oct 2026', status: 'Successful' },
  { customer: 'Mariam Namusoke', service: 'Event management', amount: 'UGX 8,500,000', date: '03 Oct 2026', status: 'Successful' },
  { customer: 'David Ouma', service: 'Talent programme', amount: 'UGX 1,200,000', date: '02 Oct 2026', status: 'Pending' },
]

const fallbackPortfolio = [
  { label: 'Construction', count: 24, width: 38 },
  { label: 'Education', count: 14, width: 22 },
  { label: 'Events', count: 11, width: 19 },
  { label: 'Talent development', count: 9, width: 14 },
]

export default async function DashboardPage() {
  const snapshot = await getAdminSnapshot()
  const max = Math.max(...(snapshot?.portfolio.map((item) => item.count) ?? [1]), 1)

  return (
    <OperationsDashboard
      requests={snapshot?.requests ?? fallbackRequests}
      payments={snapshot?.payments ?? fallbackPayments}
      portfolio={snapshot ? snapshot.portfolio.map((item) => ({ ...item, width: Math.round((item.count / max) * 100) })) : fallbackPortfolio}
      metrics={snapshot?.metrics ?? {
        customers: '248',
        activeServices: '67',
        revenue: 'UGX 184.6M',
        outstanding: 'UGX 72.4M',
        divisions: '5',
        dueMilestones: '12',
        documentsToReview: '6',
        completed: '18',
      }}
    />
  )
}
