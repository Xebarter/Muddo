import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { usesOfImage, type GalleryImageRecords } from '@/lib/gallery-uses'
import { createClient } from '@/lib/supabase/server'

const maxImageBytes = 5_000_000

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') return null
  return supabase
}

function refreshGallery() {
  revalidatePath('/')
  revalidatePath('/gallery')
  revalidatePath('/what-we-do')
  revalidatePath('/admin/gallery')
  revalidatePath('/admin/homepage')
  revalidatePath('/admin/services')
}

async function storeImage(supabase: NonNullable<Awaited<ReturnType<typeof requireAdmin>>>, file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${Date.now()}-${randomBytes(4).toString('hex')}.${extension}`
  const { error } = await supabase.storage.from('gallery').upload(path, file, { contentType: file.type })
  if (error) return null
  return supabase.storage.from('gallery').getPublicUrl(path).data.publicUrl
}

function readImage(form: FormData) {
  const file = form.get('image')
  if (!(file instanceof File) || file.size === 0 || !file.type.startsWith('image/') || file.size > maxImageBytes) return null
  return file
}

async function imageRecords(supabase: NonNullable<Awaited<ReturnType<typeof requireAdmin>>>): Promise<GalleryImageRecords | null> {
  const [activities, uploads, services, hero] = await Promise.all([
    supabase.from('homepage_activities').select('id, title, image_path'),
    supabase.from('gallery_items').select('id, image_path'),
    supabase.from('services').select('id, title, image_path'),
    supabase.from('homepage_settings').select('hero_image_path').eq('id', 1).maybeSingle(),
  ])
  if (activities.error || uploads.error) return null
  return {
    hero: hero.data?.hero_image_path ?? '',
    stories: (activities.data ?? []).flatMap((item) => (item.image_path ? [{ id: item.id, title: item.title, image: item.image_path }] : [])),
    services: services.error ? [] : (services.data ?? []).flatMap((item) => (item.image_path?.trim() ? [{ id: item.id, title: item.title, image: item.image_path }] : [])),
    uploads: (uploads.data ?? []).flatMap((item) => (item.image_path ? [{ id: item.id, image: item.image_path }] : [])),
  }
}

export async function POST(request: Request) {
  const supabase = await requireAdmin()
  if (!supabase) return Response.json({ error: 'Admin access is required.' }, { status: 403 })

  const file = readImage(await request.formData())
  if (!file) return Response.json({ error: 'Choose an image under 5 MB.' }, { status: 400 })

  const image = await storeImage(supabase, file)
  if (!image) return Response.json({ error: 'The photo could not be uploaded. Run the Supabase script so the gallery bucket exists.' }, { status: 500 })

  const { data: last } = await supabase.from('gallery_items').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle()
  const { error } = await supabase.from('gallery_items').insert({
    title: '',
    category: '',
    image_path: image,
    sort_order: (last?.sort_order ?? 0) + 1,
    status: 'published',
  })
  if (error) return Response.json({ error: 'The photo could not be added.' }, { status: 400 })

  refreshGallery()
  return Response.json({ ok: true })
}

export async function PATCH(request: Request) {
  const supabase = await requireAdmin()
  if (!supabase) return Response.json({ error: 'Admin access is required.' }, { status: 403 })

  const form = await request.formData()
  const id = String(form.get('id') ?? '')
  const source = String(form.get('source') ?? '')
  const file = readImage(form)
  if (!/^[0-9a-f-]{36}$/i.test(id) || (source !== 'story' && source !== 'upload') || !file) {
    return Response.json({ error: 'Choose an image under 5 MB.' }, { status: 400 })
  }

  const image = await storeImage(supabase, file)
  if (!image) return Response.json({ error: 'The photo could not be uploaded. Run the Supabase script so the gallery bucket exists.' }, { status: 500 })

  const query = source === 'story'
    ? supabase.from('homepage_activities').update({ image_path: image }).eq('id', id)
    : supabase.from('gallery_items').update({ image_path: image }).eq('id', id)
  const { data, error } = await query.select('id')
  if (error || !data?.length) return Response.json({ error: 'The photo could not be updated.' }, { status: 400 })

  refreshGallery()
  return Response.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await requireAdmin()
  if (!supabase) return Response.json({ error: 'Admin access is required.' }, { status: 403 })

  let id = ''
  try {
    const body = await request.json() as { id?: unknown }
    if (typeof body.id === 'string') id = body.id
  } catch {
    return Response.json({ error: 'The photo could not be removed.' }, { status: 400 })
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: 'The photo could not be removed.' }, { status: 400 })

  const { data: photo, error: readError } = await supabase.from('gallery_items').select('id, image_path').eq('id', id).maybeSingle()
  if (readError || !photo) return Response.json({ error: 'The photo could not be removed.' }, { status: 400 })

  const records = await imageRecords(supabase)
  if (!records) return Response.json({ error: 'The photo could not be removed.' }, { status: 400 })
  const uses = usesOfImage(photo.image_path, { source: 'upload', id: photo.id }, records)
  if (uses.length > 0) {
    return Response.json({ error: 'This photo is used somewhere else.', uses }, { status: 409 })
  }

  const { error } = await supabase.from('gallery_items').delete().eq('id', id)
  if (error) return Response.json({ error: 'The photo could not be removed.' }, { status: 400 })

  const marker = '/storage/v1/object/public/gallery/'
  const start = photo.image_path.indexOf(marker)
  if (start !== -1) {
    const path = decodeURIComponent(photo.image_path.slice(start + marker.length).split('?')[0])
    if (path) await supabase.storage.from('gallery').remove([path])
  }

  refreshGallery()
  return Response.json({ ok: true })
}
