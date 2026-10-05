export const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'] as const
export const jobStatuses = ['draft', 'published', 'closed'] as const
export const applicationStatuses = ['new', 'reviewing', 'shortlisted', 'declined'] as const

export type EmploymentType = (typeof employmentTypes)[number]
export type JobStatus = (typeof jobStatuses)[number]
export type ApplicationStatus = (typeof applicationStatuses)[number]

export function jobSlug(title: string) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
  return base || 'role'
}
