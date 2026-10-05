import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return Response.json({ error: 'Admin access is required.' }, { status: 403 })
  }

  const form = await request.formData()
  const file = form.get('image')
  if (!(file instanceof File) || file.size === 0 || !file.type.startsWith('image/') || file.size > 5_000_000) {
    return Response.json({ error: 'Choose an image under 5 MB.' }, { status: 400 })
  }

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${Date.now()}-${randomBytes(4).toString('hex')}.${extension}`
  const { error: uploadError } = await supabase.storage.from('gallery').upload(path, file, { contentType: file.type })
  if (uploadError) return Response.json({ error: 'The photo could not be uploaded. Run the Supabase script so the gallery bucket exists.' }, { status: 500 })

  const image = supabase.storage.from('gallery').getPublicUrl(path).data.publicUrl
  const { data: last } = await supabase.from('gallery_items').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle()
  const { error } = await supabase.from('gallery_items').insert({
    title: '',
    category: '',
    image_path: image,
    sort_order: (last?.sort_order ?? 0) + 1,
    status: 'published',
  })
  if (error) return Response.json({ error: 'The photo could not be added.' }, { status: 400 })

  revalidatePath('/')
  revalidatePath('/gallery')
  revalidatePath('/admin/gallery')
  return Response.json({ ok: true })
}
