import { AdminShell } from '@/components/admin/admin-shell'
import { getAdminSnapshot } from '@/lib/data'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const snapshot = await getAdminSnapshot()
  return (
    <AdminShell
      requestCount={snapshot ? String(snapshot.requests.length).padStart(2, '0') : '08'}
      contactName={snapshot?.settings.contact_name ?? 'Admin Manager'}
      roleLabel={snapshot?.settings.role_label ?? 'Operations'}
    >
      {children}
    </AdminShell>
  )
}
