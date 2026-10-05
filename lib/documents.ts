export const documentTypes = ['Contract', 'Quotation', 'Receipt', 'Report', 'Invoice', 'Letter', 'Other'] as const

export const documentStatuses = ['draft', 'awaiting_review', 'signed', 'published', 'available'] as const

export type DocumentStatus = (typeof documentStatuses)[number]

export function documentStatusLabel(status: string) {
  if (status === 'draft') return 'Draft, hidden from the customer'
  if (status === 'awaiting_review') return 'Awaiting review'
  if (status === 'signed') return 'Signed'
  if (status === 'published') return 'Published'
  if (status === 'available') return 'Available to the customer'
  return status
}

export const sharedDocumentStatuses = new Set<string>(['awaiting_review', 'signed', 'published', 'available'])
