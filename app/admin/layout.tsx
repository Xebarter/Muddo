import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/admin/admin-shell'
import { getAdminSnapshot } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')
  if (user.app_metadata?.role !== 'admin') redirect('/account')

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
