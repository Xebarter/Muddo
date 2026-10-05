'use client'

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, Bell, FileText, Home, LayoutDashboard, Menu, ShieldCheck, User, WalletCards, X } from 'lucide-react'
import { BrandMark } from '@/components/site/design-system'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { ProfileProvider, useProfile } from '@/components/account/profile-context'
import { ProfilePhoto } from '@/components/account/profile-photo'
import type { PortalProfile } from '@/lib/data'

const navigation = [
  { label: 'Overview', href: '/account', icon: LayoutDashboard },
  { label: 'My services', href: '/account/services', icon: Home },
  { label: 'Payments', href: '/account/payments', icon: WalletCards },
  { label: 'Documents', href: '/account/documents', icon: FileText },
  { label: 'Notifications', href: '/account/notifications', icon: Bell },
  { label: 'Profile', href: '/account/profile', icon: User },
]

function isCurrent(pathname: string, href: string) {
  if (href === '/account') return pathname === '/account'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AccountShell({ children, profile, unread }: { children: React.ReactNode; profile: PortalProfile; unread: number }) {
  return (
    <ProfileProvider initial={{ name: profile.name, email: profile.email, phone: profile.phone, location: profile.location, avatar: profile.avatar }} role={profile.role}>
      <AccountFrame unread={unread}>{children}</AccountFrame>
    </ProfileProvider>
  )
}

function AccountFrame({ children, unread }: { children: React.ReactNode; unread: number }) {
  const { profile, role } = useProfile()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const dismissMenu = useCallback(() => setMenuOpen(false), [])
  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    const button = menuButtonRef.current
    if (button && getComputedStyle(button).display !== 'none') button.focus()
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <main className="min-h-screen bg-brand-surface text-brand-ink">
      <header className="sticky top-0 z-30 border-b border-brand-line bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-2 px-4 sm:h-20 sm:gap-4 sm:px-5 md:px-8">
          <Link href="/" aria-label="Mudogwaluyiira Group home" className="min-w-0">
            <BrandMark size="sm" />
          </Link>
          <div className="flex shrink-0 items-center">
            <Link href="/account/notifications" aria-label={`Notifications, ${unread} unread`} className="relative flex size-11 items-center justify-center text-brand-muted transition-colors hover:text-brand-ink">
              <Bell size={18} strokeWidth={1.5} />
              {unread > 0 && <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-brand-gold-deep" />}
            </Link>
            <Link href="/account/profile" className="flex items-center gap-3 transition-colors hover:text-brand-gold-deep sm:border-l sm:border-brand-line sm:pl-4">
              <ProfilePhoto src={profile.avatar} size={36} />
              <div className="hidden sm:block">
                <p className="text-xs font-semibold">{profile.name}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-brand-muted">{role}</p>
              </div>
            </Link>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex size-11 items-center justify-center text-brand-ink transition-colors hover:text-brand-gold-deep md:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="account-menu"
            >
              <Menu strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-20 hidden h-[calc(100dvh-5rem)] w-72 shrink-0 flex-col bg-[#101c17] text-white md:flex">
          <AccountNav pathname={pathname} unread={unread} showIntro />
        </aside>
        <section className="min-w-0 flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-8 md:px-10 md:py-12">{children}</section>
      </div>

      <AccountDrawer open={menuOpen} onClose={closeMenu} onNavigate={dismissMenu} pathname={pathname} unread={unread} />
    </main>
  )
}

function AccountNav({ pathname, unread, onNavigate, motion, showIntro = false }: { pathname: string; unread: number; onNavigate?: () => void; motion?: boolean; showIntro?: boolean }) {
  const { profile } = useProfile()
  const links = navigation.map((item) => item.href === '/account/notifications' && unread > 0
    ? { ...item, count: String(unread).padStart(2, '0') }
    : item)

  return (
    <>
      {showIntro && (
        <div className="shrink-0 border-b border-white/10 px-6 py-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-gold-light">Customer portal</p>
          <Link href="/account/profile" onClick={onNavigate} className="mt-2 block truncate font-serif text-[1.65rem] leading-none tracking-[-0.03em] transition-colors hover:text-brand-gold-light">{profile.name}</Link>
        </div>
      )}
      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-5" aria-label="Account">
        <p className="px-4 pb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">Your account</p>
        {links.map((item, index) => (
          <AccountLink key={item.href} {...item} current={isCurrent(pathname, item.href)} onNavigate={onNavigate} motion={motion} delay={70 + index * 35} />
        ))}
      </nav>
      <div className="shrink-0 border-t border-white/10 px-6 py-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex h-11 items-center justify-center gap-2 border border-white/15 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:border-brand-gold-light hover:text-brand-gold-light"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Back to Home
        </Link>
        <div className="mt-5 flex items-start gap-3">
          <ShieldCheck className="mt-0.5 text-brand-gold-light" size={17} strokeWidth={1.5} />
          <div>
            <p className="text-xs font-semibold">Secure account</p>
            <p className="mt-1 text-xs leading-5 text-white/45">Your services, payments and documents stay in this portal.</p>
            <SignOutButton className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-gold-light" />
          </div>
        </div>
      </div>
    </>
  )
}

function AccountLink({
  href,
  label,
  icon: Icon,
  count,
  current,
  onNavigate,
  motion,
  delay = 0,
}: {
  href: string
  label: string
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  count?: string
  current: boolean
  onNavigate?: () => void
  motion?: boolean
  delay?: number
}) {
  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      onClick={onNavigate}
      style={motion === undefined ? undefined : { transitionDelay: `${delay}ms` }}
      className={`group relative flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-500 ${motion === false ? 'translate-x-4 opacity-0' : 'translate-x-0 opacity-100'} ${current ? 'bg-white/[0.06] text-white' : 'text-white/60 hover:bg-white/[0.04] hover:text-white'}`}
    >
      <span className={`absolute inset-y-2 left-0 w-px ${current ? 'bg-brand-gold-light' : 'bg-transparent group-hover:bg-white/25'}`} />
      <Icon size={17} strokeWidth={1.5} className={current ? 'text-brand-gold-light' : 'text-white/40 transition-colors group-hover:text-brand-gold-light'} />
      <span className="truncate">{label}</span>
      {count && <span className="ml-auto flex h-5 min-w-5 items-center justify-center bg-brand-gold px-1 text-[10px] font-bold text-brand-ink">{count}</span>}
    </Link>
  )
}

function AccountDrawer({ open, onClose, onNavigate, pathname, unread }: { open: boolean; onClose: () => void; onNavigate: () => void; pathname: string; unread: number }) {
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const desktop = window.matchMedia('(min-width: 768px)')
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
    <div className={`fixed inset-0 z-40 h-dvh md:hidden ${open ? '' : 'pointer-events-none'}`} inert={!open}>
      <button type="button" aria-label="Close menu" tabIndex={-1} onClick={onClose} className={`absolute inset-0 bg-[#0b1612]/60 backdrop-blur-[3px] transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside
        ref={panelRef}
        id="account-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Account menu"
        className={`absolute inset-y-0 right-0 flex h-full w-[min(82vw,24.5rem)] flex-col bg-[#101c17] pt-[env(safe-area-inset-top)] text-white shadow-[-28px_0_80px_rgba(8,16,13,0.5)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <span className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-brand-gold-light to-transparent" />
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-gold-light">Portal</p>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close menu" className="flex size-11 items-center justify-center border border-white/15 text-white transition-colors hover:border-brand-gold-light hover:text-brand-gold-light">
            <X strokeWidth={1.5} />
          </button>
        </div>
        <AccountNav pathname={pathname} unread={unread} onNavigate={onNavigate} motion={open} showIntro />
      </aside>
    </div>
  )
}
