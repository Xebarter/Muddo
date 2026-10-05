'use client'

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  Bell,
  Building2,
  ClipboardList,
  FileText,
  Briefcase,
  Images,
  Mail,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import { BrandMark } from '@/components/site/design-system'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { AdminProgressProvider } from '@/components/admin/save-progress'

const navigation = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Service requests', href: '/admin/service-requests', icon: ClipboardList, count: '08' },
  { label: 'Services & projects', href: '/admin/services', icon: Building2 },
  { label: 'Payments', href: '/admin/payments', icon: WalletCards },
  { label: 'Progress updates', href: '/admin/progress', icon: Activity },
  { label: 'Documents', href: '/admin/documents', icon: FileText },
  { label: 'Homepage content', href: '/admin/homepage', icon: LayoutDashboard },
  { label: 'Gallery', href: '/admin/gallery', icon: Images },
  { label: 'Messages', href: '/admin/messages', icon: Mail },
  { label: 'Careers', href: '/admin/careers', icon: Briefcase },
]

const settingsItem = { label: 'Settings', href: '/admin/settings', icon: Settings }

function isCurrent(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminShell({
  children,
  requestCount = '08',
  messageCount,
  applicationCount,
  contactName = 'Admin Manager',
  roleLabel = 'Operations',
}: {
  children: React.ReactNode
  requestCount?: string
  messageCount?: string
  applicationCount?: string
  contactName?: string
  roleLabel?: string
}) {
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
    <AdminProgressProvider>
    <main className="min-h-screen bg-brand-surface text-brand-ink">
      <header className="sticky top-0 z-30 border-b border-brand-line bg-white/95 backdrop-blur-md">
        <div className="flex h-20 items-center justify-between gap-4 px-5 md:px-8">
          <Link href="/" aria-label="Mudogwaluyiira Group home" className="min-w-0">
            <BrandMark />
          </Link>
          <div className="flex items-center gap-1">
            <button aria-label="Notifications" className="relative hidden size-11 items-center justify-center text-brand-muted transition-colors hover:text-brand-ink sm:flex">
              <Bell size={18} strokeWidth={1.5} />
              <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-brand-gold-deep" />
            </button>
            <div className="hidden items-center gap-3 border-l border-brand-line pl-4 sm:flex">
              <span className="flex size-9 items-center justify-center bg-brand-ink text-sm font-semibold text-white">{contactName.slice(0, 2).toUpperCase()}</span>
              <div>
                <p className="text-xs font-semibold">{contactName}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-brand-muted">{roleLabel}</p>
              </div>
              <SignOutButton className="ml-2 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted hover:text-brand-ink" />
            </div>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex size-11 items-center justify-center text-brand-ink transition-colors hover:text-brand-gold-deep md:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="admin-menu"
            >
              <Menu strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-20 hidden h-[calc(100dvh-5rem)] w-72 shrink-0 flex-col border-r border-white/10 bg-[#101c17] text-white md:flex">
          <SidebarFrame pathname={pathname} requestCount={requestCount} messageCount={messageCount} applicationCount={applicationCount} showIntro />
        </aside>
        <section className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-12">{children}</section>
      </div>

      <AdminDrawer open={menuOpen} onClose={closeMenu} onNavigate={dismissMenu} pathname={pathname} requestCount={requestCount} messageCount={messageCount} applicationCount={applicationCount} />
    </main>
    </AdminProgressProvider>
  )
}

function SidebarFrame({ pathname, requestCount, messageCount, applicationCount, onNavigate, motion, showIntro = false }: { pathname: string; requestCount: string; messageCount?: string; applicationCount?: string; onNavigate?: () => void; motion?: boolean; showIntro?: boolean }) {
  const links = navigation.map((item) => {
    if (item.href === '/admin/service-requests') return { ...item, count: requestCount }
    if (item.href === '/admin/messages' && messageCount) return { ...item, count: messageCount }
    if (item.href === '/admin/careers' && applicationCount) return { ...item, count: applicationCount }
    return item
  })
  return (
    <>
      {showIntro && (
        <div className="shrink-0 border-b border-white/10 px-6 py-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-gold-light">Management</p>
          <p className="mt-2 font-serif text-[1.65rem] leading-none tracking-[-0.03em]">Workspace</p>
        </div>
      )}
      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-5" aria-label="Admin">
        <p className="px-4 pb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">Overview</p>
        {links.map((item, index) => (
          <NavLink key={item.href} {...item} current={isCurrent(pathname, item.href)} onNavigate={onNavigate} motion={motion} delay={70 + index * 35} />
        ))}
      </nav>
      <div className="shrink-0 border-t border-white/10 px-3 py-4">
        <NavLink {...settingsItem} current={isCurrent(pathname, settingsItem.href)} onNavigate={onNavigate} motion={motion} delay={70 + navigation.length * 35} />
        <SignOutButton className="mt-4 px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-gold-light" />
        <p className="px-4 pb-2 pt-4 text-[11px] leading-5 tracking-wide text-white/35">Mudogwaluyiira Group<br />Operations</p>
      </div>
    </>
  )
}

function NavLink({
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

function AdminDrawer({ open, onClose, onNavigate, pathname, requestCount, messageCount, applicationCount }: { open: boolean; onClose: () => void; onNavigate: () => void; pathname: string; requestCount: string; messageCount?: string; applicationCount?: string }) {
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
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className={`absolute inset-0 bg-[#0b1612]/60 backdrop-blur-[3px] transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        ref={panelRef}
        id="admin-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Admin menu"
        className={`absolute inset-y-0 right-0 flex h-full w-[min(82vw,24.5rem)] flex-col bg-[#101c17] pt-[env(safe-area-inset-top)] text-white shadow-[-28px_0_80px_rgba(8,16,13,0.5)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <span className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-brand-gold-light to-transparent" />
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-gold-light">Workspace</p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex size-11 items-center justify-center border border-white/15 text-white transition-colors hover:border-brand-gold-light hover:text-brand-gold-light"
          >
            <X strokeWidth={1.5} />
          </button>
        </div>
        <SidebarFrame pathname={pathname} requestCount={requestCount} messageCount={messageCount} applicationCount={applicationCount} onNavigate={onNavigate} motion={open} />
      </aside>
    </div>
  )
}
