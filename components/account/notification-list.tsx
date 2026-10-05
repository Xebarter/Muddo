'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { markNotificationRead } from '@/lib/actions'
import type { PortalNotification } from '@/lib/data'

export function NotificationList({ items }: { items: PortalNotification[] }) {
  const [readIds, setReadIds] = useState<string[]>(items.filter((item) => item.read).map((item) => item.id))

  if (items.length === 0) {
    return <p className="mt-8 border border-brand-line bg-white p-6 text-sm text-brand-muted">No updates yet. New service messages will appear here.</p>
  }

  return (
    <section className="mt-8 divide-y divide-brand-line border border-brand-line bg-white">
      {items.map((item) => {
        const read = readIds.includes(item.id)
        return (
          <article key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${read ? 'bg-brand-line' : 'bg-brand-gold-deep'}`} />
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-brand-muted">{item.body}</p>
                <p className="mt-3 text-xs text-brand-muted">{item.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:shrink-0">
              {!read && (
                <button
                  type="button"
                  onClick={async () => {
                    setReadIds((current) => [...current, item.id])
                    await markNotificationRead(item.id)
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider text-brand-muted hover:text-brand-ink"
                >
                  Mark read
                </button>
              )}
              <Link href={item.href} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-gold-deep">Open <ArrowRight size={13} /></Link>
            </div>
          </article>
        )
      })}
    </section>
  )
}
