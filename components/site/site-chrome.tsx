'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, Check, CircleUser, Menu, MoveUpRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/site/design-system'
import { businesses } from '@/lib/businesses'
import { companyEmail, companyEmailMailto, companyPhoneDisplay, companyPhoneTel } from '@/lib/contact'
import { submitServiceRequest } from '@/lib/actions'

const navItems = [
  { label: 'About Us', href: '/#about-us' },
  { label: 'Our Businesses', href: '/#our-businesses' },
  { label: 'Projects', href: '/#projects' },
  { label: 'News', href: '/#news' },
  { label: 'Careers', href: '/#careers' },
  { label: 'Contact', href: '/contact' },
]

const RequestServiceContext = createContext<() => void>(() => {})

export function RequestServiceButton({
  children,
  className,
  variant,
}: {
  children: ReactNode
  className?: string
  variant?: 'outline' | 'default'
}) {
  const open = useContext(RequestServiceContext)
  return (
    <Button onClick={open} variant={variant} className={className}>
      {children}
    </Button>
  )
}

export function SiteChrome({ children, mobileDock = false }: { children: ReactNode; mobileDock?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)

  return (
    <RequestServiceContext.Provider value={() => setRequestOpen(true)}>
      <main className="min-h-screen bg-[#f7f7f5] text-[#15251f]">
        <header className="fixed inset-x-0 top-0 z-20 border-b border-white/15 bg-[#15251f]/85 pt-[env(safe-area-inset-top)] text-white backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full min-w-0 items-center justify-between gap-2 px-4 sm:h-20 sm:gap-4 sm:px-5 lg:px-8">
            <BrandMark href="/" className="text-white" />
            <nav className="hidden shrink-0 items-center gap-5 text-[11px] font-medium uppercase tracking-[0.16em] xl:flex">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className="whitespace-nowrap transition-colors hover:text-[#d9bb7d]">{item.label}</a>
              ))}
            </nav>
            <div className="flex shrink-0 items-center gap-1">
              <a href="/account" aria-label="My Account" className="flex size-11 items-center justify-center text-white transition-colors hover:text-[#d9bb7d]">
                <CircleUser strokeWidth={1.5} />
              </a>
              <RequestServiceButton className="hidden rounded-none bg-[#c9a45c] px-5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#15251f] hover:bg-[#dbbd7e] xl:inline-flex">
                Request a service
              </RequestServiceButton>
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="flex size-11 items-center justify-center text-white xl:hidden"
                aria-label="Open menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
              >
                <Menu strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </header>
        <MobileMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onRequest={() => { setMenuOpen(false); setRequestOpen(true) }}
        />
        {children}
        <footer className="bg-[#0f1c17] text-white/70">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 md:grid-cols-4 lg:px-8">
            <div className="md:col-span-2">
              <BrandMark href="/" size="sm" className="text-white" />
              <p className="mt-6 max-w-sm text-sm leading-6">Building businesses. Developing people. Creating opportunities across Uganda.</p>
            </div>
            <div>
              <p className="footer-label">Explore</p>
              <div className="mt-5 flex flex-col gap-3 text-sm">
                <a href="/#about-us">About us</a>
                <a href="/#projects">Projects</a>
                <a href="/contact">Contact</a>
              </div>
              <p className="footer-label mt-8">Businesses</p>
              <div className="mt-5 flex flex-col gap-3 text-sm">
                {businesses.map((business) => (
                  <a key={business.slug} href={`/businesses/${business.slug}`}>{business.title}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="footer-label">Contact</p>
              <div className="mt-5 flex flex-col gap-3 text-sm">
                <a href={companyPhoneTel}>{companyPhoneDisplay}</a>
                <a href={companyEmailMailto}>{companyEmail}</a>
                <span>Kampala, Uganda</span>
              </div>
            </div>
          </div>
          <div className={`mx-auto flex max-w-7xl flex-col gap-3 border-t border-white/10 px-5 py-6 text-[11px] md:flex-row md:justify-between lg:px-8 ${mobileDock ? 'max-sm:pb-36' : ''}`}>
            <span>© 2026 Mudogwaluyiira Group of Companies. All rights reserved.</span>
            <span>Privacy · Terms · Customer portal</span>
          </div>
        </footer>
        {requestOpen && <RequestModal onClose={() => setRequestOpen(false)} />}
      </main>
    </RequestServiceContext.Provider>
  )
}

function MobileMenu({ open, onClose, onRequest }: { open: boolean; onClose: () => void; onRequest: () => void }) {
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const desktop = window.matchMedia('(min-width: 1280px)')
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    const closeOnDesktop = () => {
      if (desktop.matches) onClose()
    }

    desktop.addEventListener('change', closeOnDesktop)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      desktop.removeEventListener('change', closeOnDesktop)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  return (
    <div className={`fixed inset-0 z-40 h-dvh xl:hidden ${open ? '' : 'pointer-events-none'}`} inert={!open}>
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className={`absolute inset-0 bg-[#0b1612]/60 backdrop-blur-[3px] transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        ref={panelRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={`absolute inset-y-0 right-0 flex h-full w-[min(82vw,24.5rem)] flex-col bg-[#101c17] pt-[env(safe-area-inset-top)] text-white shadow-[-28px_0_80px_rgba(8,16,13,0.5)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <span className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-[#d9bb7d] to-transparent" />
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d9bb7d]">Navigation</p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex size-11 items-center justify-center border border-white/15 text-white transition-colors hover:border-[#d9bb7d] hover:text-[#d9bb7d]"
          >
            <X strokeWidth={1.5} />
          </button>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-6 py-6">
          {navItems.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`group flex items-center justify-between gap-4 border-b border-white/10 py-4 transition-all duration-500 hover:border-[#d9bb7d]/50 ${open ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}
              style={{ transitionDelay: open ? `${90 + index * 45}ms` : '0ms' }}
            >
              <span className="flex items-baseline gap-4">
                <span className="w-6 text-[10px] font-semibold tracking-[0.18em] text-[#d9bb7d]">0{index + 1}</span>
                <span className="font-serif text-[1.35rem] leading-none tracking-[-0.03em] transition-colors group-hover:text-[#d9bb7d] min-[400px]:text-[1.65rem]">{item.label}</span>
              </span>
              <MoveUpRight className="size-4 shrink-0 text-white/25 transition-colors group-hover:text-[#d9bb7d]" />
            </a>
          ))}
          <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d9bb7d]">Businesses</p>
          {businesses.map((business) => (
            <a key={business.slug} href={`/businesses/${business.slug}`} onClick={onClose} className="border-b border-white/10 py-3 text-sm text-white/80 transition-colors hover:text-[#d9bb7d]">
              {business.title}
            </a>
          ))}
        </nav>
        <div className="shrink-0 border-t border-white/10 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
          <a href="/account" onClick={onClose} className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65 transition-colors hover:text-[#d9bb7d]">My Account</a>
          <Button onClick={onRequest} className="mt-4 h-12 w-full rounded-none bg-[#c9a45c] text-[11px] font-bold uppercase tracking-[0.16em] text-[#15251f] hover:bg-[#dbbd7e]">
            Request a service <ArrowRight data-icon="inline-end" />
          </Button>
          <p className="mt-5 text-[11px] leading-5 tracking-wide text-white/45">Kampala, Uganda<br /><a href={companyPhoneTel} className="transition-colors hover:text-[#d9bb7d]">{companyPhoneDisplay}</a><br /><a href={companyEmailMailto} className="transition-colors hover:text-[#d9bb7d]">{companyEmail}</a></p>
        </div>
      </aside>
    </div>
  )
}

function RequestModal({ onClose }: { onClose: () => void }) {
  const [reference, setReference] = useState<string | null>(null)
  const [error, setError] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1c17]/80 p-4">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-auto bg-[#f7f7f5] p-7 text-[#15251f] md:p-10">
        <button onClick={onClose} className="absolute right-5 top-5" aria-label="Close request form"><X /></button>
        {reference ? (
          <div className="py-12 text-center">
            <BrandMark size="sm" className="mb-8 justify-center" />
            <div className="mx-auto flex size-14 items-center justify-center bg-[#dce9df] text-[#28704d]"><Check /></div>
            <h2 className="mt-6 font-serif text-3xl">Request received.</h2>
            <p className="mt-3 text-sm leading-6 text-[#65736d]">Thank you. Our team will be in touch shortly.</p>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.15em] text-[#b48b45]">Reference: {reference}</p>
            <Button onClick={onClose} className="mt-8 rounded-none bg-[#15251f]">Close</Button>
          </div>
        ) : (
          <>
            <BrandMark size="sm" className="mb-6" />
            <p className="eyebrow">Start a conversation</p>
            <h2 className="mt-2 font-serif text-3xl">Request a service</h2>
            <p className="mt-3 text-sm text-[#65736d]">Tell us a little about what you need and the right team will follow up.</p>
            <form
              action={async (formData) => {
                const result = await submitServiceRequest(formData)
                if (result.error || !result.reference) {
                  setError(result.error ?? 'The request could not be saved.')
                  return
                }
                setError('')
                setReference(result.reference)
              }}
              className="mt-7 flex flex-col gap-4"
            >
              <input name="full_name" required placeholder="Full name" className="field" />
              <div className="grid gap-4 sm:grid-cols-2">
                <input name="phone" required type="tel" placeholder="Phone number" className="field" />
                <input name="email" required type="email" placeholder="Email address" className="field" />
              </div>
              <select name="service" required defaultValue="" className="field">
                <option value="" disabled>Service required</option>
                {businesses.map((business) => <option key={business.slug} value={business.title}>{business.title}</option>)}
                <option value="Other">Other</option>
              </select>
              <input name="location" placeholder="Location" className="field" />
              <textarea name="description" placeholder="Description / requirements" rows={4} className="field resize-none" />
              {error && <p className="text-sm text-red-700">{error}</p>}
              <Button type="submit" className="mt-2 rounded-none bg-[#15251f] py-6 text-xs font-bold uppercase tracking-[0.16em]">Submit request <ArrowRight data-icon="inline-end" /></Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
