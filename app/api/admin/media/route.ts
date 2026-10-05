import { randomBytes } from 'crypto'
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
  const { error } = await supabase.storage.from('gallery').upload(path, file, { contentType: file.type })
  if (error) return Response.json({ error: 'The image could not be uploaded. Run the Supabase script so the gallery bucket exists.' }, { status: 500 })

  return Response.json({ url: supabase.storage.from('gallery').getPublicUrl(path).data.publicUrl })
}
