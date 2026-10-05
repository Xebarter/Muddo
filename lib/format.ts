export function formatUgx(amount: number) {
  return `UGX ${new Intl.NumberFormat('en-UG').format(amount)}`
}

export function formatShortUgx(amount: number) {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000
    const rounded = Number.isInteger(millions) ? String(millions) : millions.toFixed(1)
    return `UGX ${rounded}M`
  }
  return formatUgx(amount)
}

export function todayInKampala() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kampala' }).format(new Date())
}

export function formatLongDate(value: string | null | undefined) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Kampala' }).format(new Date(value))
}

export function formatRequestWhen(value: string) {
  const date = new Date(value)
  const today = new Date()
  const sameDay = date.toDateString() === today.toDateString()
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Africa/Kampala' }).format(date)
  if (sameDay) return `Today, ${time}`
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return formatLongDate(value)
}

const requestLabels: Record<string, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  contacted: 'Contacted',
  converted: 'Converted',
  closed: 'Closed',
}

export function requestLabel(status: string) {
  return requestLabels[status] ?? status
}

export function requestTone(status: string): 'gold' | 'green' | 'muted' {
  if (status === 'contacted' || status === 'converted') return 'green'
  if (status === 'reviewing' || status === 'closed') return 'muted'
  return 'gold'
}

export function paymentLabel(status: string) {
  if (status === 'paid') return 'Successful'
  if (status === 'due_soon') return 'Due soon'
  if (status === 'pending') return 'Pending'
  if (status === 'failed') return 'Failed'
  return 'Due'
}

export const installmentStatuses = ['paid', 'due', 'due_soon', 'pending', 'failed'] as const
export const receiptStatuses = ['pending', 'paid', 'failed'] as const

export function installmentLabel(status: string) {
  if (status === 'paid') return 'Paid'
  if (status === 'due_soon') return 'Due soon'
  if (status === 'pending') return 'Pending'
  if (status === 'failed') return 'Failed'
  return 'Due'
}

export function serviceLabel(status: string) {
  if (status === 'in_progress') return 'In progress'
  if (status === 'completed') return 'Completed'
  if (status === 'on_hold') return 'On hold'
  return 'Planned'
}

export function documentLabel(status: string) {
  if (status === 'awaiting_review') return 'Awaiting review'
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll('_', ' ')
}
