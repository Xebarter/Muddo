export type GalleryImageUse = {
  kind: 'story' | 'hero' | 'service' | 'photo'
  id: string
  label: string
  href: string
}

export type GalleryImageRecords = {
  hero: string
  stories: { id: string; title: string; image: string }[]
  services: { id: string; title: string; image: string }[]
  uploads: { id: string; image: string }[]
}

function sameImage(left: string, right: string) {
  return left.trim() !== '' && left.trim() === right.trim()
}

export function usesOfImage(
  image: string,
  self: { source: 'story' | 'upload'; id: string },
  records: GalleryImageRecords,
): GalleryImageUse[] {
  const uses: GalleryImageUse[] = []
  if (sameImage(records.hero, image)) {
    uses.push({ kind: 'hero', id: 'hero', label: 'Homepage hero', href: '/admin/homepage#hero' })
  }
  for (const story of records.stories) {
    if (!sameImage(story.image, image)) continue
    uses.push({
      kind: 'story',
      id: story.id,
      label: story.title.trim() || 'What we do story',
      href: `/admin/homepage?story=${encodeURIComponent(story.id)}`,
    })
  }
  for (const service of records.services) {
    if (!sameImage(service.image, image)) continue
    uses.push({
      kind: 'service',
      id: service.id,
      label: service.title.trim() || 'Service',
      href: `/admin/services?service=${encodeURIComponent(service.id)}`,
    })
  }
  for (const upload of records.uploads) {
    if (self.source === 'upload' && self.id === upload.id) continue
    if (!sameImage(upload.image, image)) continue
    uses.push({ kind: 'photo', id: upload.id, label: 'Another gallery photo', href: '/admin/gallery' })
  }
  return uses
}
