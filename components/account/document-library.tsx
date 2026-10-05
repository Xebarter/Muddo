'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { StatusBadge } from '@/components/site/design-system'
import type { PortalDocument } from '@/lib/data'

export function DocumentLibrary({ documents }: { documents: PortalDocument[] }) {
  const [selectedId, setSelectedId] = useState(documents[0]?.id ?? '')
  const selected = documents.find((item) => item.id === selectedId) ?? documents[0]

  if (!selected) {
    return <p className="mt-8 border border-brand-line bg-white p-6 text-sm text-brand-muted">No documents have been filed for this account yet.</p>
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="border border-brand-line bg-white">
        <div className="divide-y divide-brand-line">
          {documents.map((item) => {
            const selectedRow = item.id === selected.id
            return (
              <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} aria-pressed={selectedRow} className={`flex w-full items-center gap-4 p-5 text-left transition-colors ${selectedRow ? 'bg-brand-surface' : 'hover:bg-brand-surface/60'}`}>
                <span className="flex size-10 items-center justify-center bg-white"><FileText size={16} className="text-brand-gold-deep" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{item.name}</span>
                  <span className="mt-1 block text-xs text-brand-muted">{item.type} · {item.date}</span>
                </span>
                <StatusBadge tone={item.status === 'Awaiting review' ? 'gold' : item.status === 'Signed' || item.status === 'Published' || item.status === 'Available' ? 'green' : 'muted'}>{item.status}</StatusBadge>
              </button>
            )
          })}
        </div>
      </section>
      <aside className="border border-brand-line bg-brand-ink p-6 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-light">{selected.type}</p>
        <h2 className="mt-3 font-serif text-2xl">{selected.name}</h2>
        <p className="mt-4 text-sm leading-6 text-white/65">{selected.detail}</p>
        <p className="mt-6 text-xs text-white/45">Filed {selected.date}</p>
        {selected.file && (
          <a href={selected.file} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex h-12 w-full items-center justify-center bg-brand-gold px-5 text-xs font-bold uppercase tracking-[0.12em] text-brand-ink hover:bg-brand-gold-light sm:w-auto">
            Open file
          </a>
        )}
      </aside>
    </div>
  )
}
