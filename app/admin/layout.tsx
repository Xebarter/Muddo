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
  const [{ count: newMessages, error: messageError }, { count: newApplications, error: applicationError }] = await Promise.all([
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ])
  return (
    <AdminShell
      requestCount={snapshot ? String(snapshot.requests.length).padStart(2, '0') : '08'}
      messageCount={messageError || !newMessages ? undefined : String(newMessages).padStart(2, '0')}
      applicationCount={applicationError || !newApplications ? undefined : String(newApplications).padStart(2, '0')}
      contactName={snapshot?.settings.contact_name ?? 'Admin Manager'}
      roleLabel={snapshot?.settings.role_label ?? 'Operations'}
    >
      {children}
    </AdminShell>
  )
}
