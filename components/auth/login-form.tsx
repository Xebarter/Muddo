'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  updateProfile,
} from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase/client'

function authMessage(code: string) {
  const messages: Record<string, string> = {
    'auth/too-many-requests': 'Too many attempts. Wait a moment, then try again.',
    'auth/invalid-credential': 'The email or password is not correct.',
    'auth/user-not-found': 'No account uses that email yet.',
    'auth/wrong-password': 'The email or password is not correct.',
    'auth/email-already-in-use': 'An account already uses that email. Sign in instead.',
    'auth/weak-password': 'Use a password of at least 8 characters.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
    'auth/popup-blocked': 'Allow pop-ups for this site, then try Google again.',
    'auth/operation-not-allowed': 'That sign-in method is turned off in the Firebase project.',
  }
  return messages[code] ?? ''
}

function readableError(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: string }).code) : ''
  const message = error instanceof Error ? error.message : ''
  const mapped = code ? authMessage(code) : ''
  if (mapped) return mapped
  if (message && message.length < 180 && !/firebase/i.test(message)) return message
  return 'Sign-in could not be completed. Try again.'
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'sign-in' | 'create'>('sign-in')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const openWorkspace = async (idToken: string) => {
    const response = await fetch('/api/auth/firebase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    const body = await response.json() as { error?: string; role?: string }
    if (!response.ok) throw new Error(body.error || 'The account could not be opened.')

    const next = searchParams.get('next')
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : ''
    const destination = safeNext.startsWith('/admin') && body.role !== 'admin'
      ? '/account'
      : safeNext || (body.role === 'admin' ? '/admin' : '/account')
    router.push(destination)
    router.refresh()
  }

  const onEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    setPending(true)
    try {
      const auth = getFirebaseAuth()
      await setPersistence(auth, inMemoryPersistence)
      const result = mode === 'create'
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password)
      if (mode === 'create') {
        const fullName = String(form.get('full_name') ?? '').trim()
        if (fullName) await updateProfile(result.user, { displayName: fullName })
      }
      await openWorkspace(await result.user.getIdToken(true))
    } catch (caught) {
      setError(readableError(caught))
      setPending(false)
    }
  }

  const onGoogle = async () => {
    setError('')
    setPending(true)
    try {
      const auth = getFirebaseAuth()
      await setPersistence(auth, inMemoryPersistence)
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const result = await signInWithPopup(auth, provider)
      await openWorkspace(await result.user.getIdToken())
    } catch (caught) {
      setError(readableError(caught))
      setPending(false)
    }
  }

  return (
    <div className="mt-6 lg:mt-8">
      <form onSubmit={onEmail} className="flex flex-col gap-4">
        {mode === 'create' && <input name="full_name" autoComplete="name" placeholder="Full name" className="field" />}
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-muted">Email</span>
          <input name="email" type="email" required autoFocus autoComplete="email" placeholder="Email address" className="field mt-2" />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-muted">Password</span>
          <input name="password" type="password" required minLength={8} autoComplete={mode === 'create' ? 'new-password' : 'current-password'} placeholder="Password" className="field mt-2" />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={pending} className="h-12 bg-brand-ink text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-brand-ink/90 disabled:opacity-60">
          {pending ? 'Please wait' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </button>
        <button type="button" onClick={() => { setMode(mode === 'sign-in' ? 'create' : 'sign-in'); setError('') }} className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-gold-deep">
          {mode === 'sign-in' ? 'Need an account? Create one' : 'Already registered? Sign in'}
        </button>
      </form>
      <div className="mt-6 lg:mt-8">
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">
          <span className="h-px flex-1 bg-brand-line" />
          Or
          <span className="h-px flex-1 bg-brand-line" />
        </div>
        <button type="button" onClick={onGoogle} disabled={pending} className="mt-4 flex h-12 w-full items-center justify-center gap-3 border border-brand-line text-sm font-semibold text-brand-ink hover:border-brand-ink disabled:opacity-60">
          <GoogleMark />
          Continue with Google
        </button>
      </div>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}
