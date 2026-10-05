import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const tables = {
  gallery: 'gallery_items',
  activity: 'homepage_activities',
} as const

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return Response.json({ error: 'Admin access is required.' }, { status: 403 })
  }

  let body: { kind?: unknown; id?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'The record could not be deleted.' }, { status: 400 })
  }

  const { kind, id } = body
  if ((kind !== 'gallery' && kind !== 'activity') || typeof id !== 'string' || id.length < 1 || id.length > 80) {
    return Response.json({ error: 'The record could not be deleted.' }, { status: 400 })
  }

  const { error } = await supabase.from(tables[kind]).delete().eq('id', id)
  if (error) return Response.json({ error: 'The record could not be deleted.' }, { status: 400 })

  revalidatePath('/')
  revalidatePath('/admin/homepage')
  revalidatePath('/admin/gallery')
  return Response.json({ ok: true })
}
