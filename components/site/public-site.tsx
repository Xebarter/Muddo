import type { ReactNode } from 'react'
import { SiteChrome } from '@/components/site/site-chrome'
import { getSiteContact } from '@/lib/data'

export async function PublicSite({ children, mobileDock = false }: { children: ReactNode; mobileDock?: boolean }) {
  const contact = await getSiteContact()
  return <SiteChrome contact={contact} mobileDock={mobileDock}>{children}</SiteChrome>
}
