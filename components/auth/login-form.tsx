'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  updateProfile,
  inMemoryPersistence,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  setPersistence,
  type ConfirmationResult,
} from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase/client'

type Step = 'phone' | 'code' | 'email'

function toE164(input: string) {
  const trimmed = input.trim()
  if (trimmed.startsWith('+')) {
    const digits = trimmed.replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 15 ? `+${digits}` : ''
  }
  let digits = trimmed.replace(/\D/g, '')
  if (digits.startsWith('256')) digits = digits.slice(3)
  if (digits.startsWith('0')) digits = digits.slice(1)
  return /^7\d{8}$/.test(digits) ? `+256${digits}` : ''
}

function formatLocal(input: string) {
  const digits = input.replace(/\D/g, '').replace(/^256/, '').replace(/^0/, '').slice(0, 9)
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean).join(' ')
}

function authMessage(code: string) {
  const messages: Record<string, string> = {
    'auth/invalid-phone-number': 'Enter a valid mobile number.',
    'auth/missing-phone-number': 'Enter a mobile number.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment, then try again.',
    'auth/invalid-verification-code': 'That code is not correct. Check the message and try again.',
    'auth/code-expired': 'That code has expired. Request a new one.',
    'auth/invalid-credential': 'The email or password is not correct.',
    'auth/user-not-found': 'No account uses that email yet.',
    'auth/wrong-password': 'The email or password is not correct.',
    'auth/email-already-in-use': 'An account already uses that email. Sign in instead.',
    'auth/weak-password': 'Use a password of at least 8 characters.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
    'auth/popup-blocked': 'Allow pop-ups for this site, then try Google again.',
    'auth/invalid-app-credential': 'Phone verification is not available for this site yet. Use email or Google.',
    'auth/captcha-check-failed': 'Phone verification could not start. Try email or Google.',
  }
  return messages[code] ?? 'Sign-in could not be completed. Try again.'
}

function readableError(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error) return authMessage(String(error.code))
  if (error instanceof Error && error.message) return error.message
  return 'Sign-in could not be completed. Try again.'
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const code = digits.join('')
  const [emailMode, setEmailMode] = useState<'sign-in' | 'create'>('sign-in')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const verifierRef = useRef<RecaptchaVerifier | null>(null)
  const codeRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setTimeout(() => setResendIn((current) => current - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendIn])

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

  const sendCode = async (number: string) => {
    const auth = getFirebaseAuth()
    await setPersistence(auth, inMemoryPersistence)
    verifierRef.current?.clear()
    const verifier = new RecaptchaVerifier(auth, 'firebase-recaptcha', { size: 'invisible' })
    verifierRef.current = verifier
    confirmationRef.current = await signInWithPhoneNumber(auth, number, verifier)
    setStep('code')
    setDigits(['', '', '', '', '', ''])
    setResendIn(30)
  }

  const onPhone = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const e164 = toE164(phone)
    if (!e164) {
      setError('Enter a valid mobile number. Ugandan numbers use 9 digits, for example 772 000 000.')
      return
    }
    setPending(true)
    try {
      await sendCode(e164)
      setPhone(e164)
    } catch (caught) {
      setError(readableError(caught))
    } finally {
      setPending(false)
    }
  }

  const onCode = async (event?: FormEvent, nextCode = code) => {
    event?.preventDefault()
    if (nextCode.length !== 6 || !confirmationRef.current) return
    setPending(true)
    setError('')
    try {
      const result = await confirmationRef.current.confirm(nextCode)
      await openWorkspace(await result.user.getIdToken())
    } catch (caught) {
      setError(readableError(caught))
      setPending(false)
    }
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
      const result = emailMode === 'create'
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password)
      if (emailMode === 'create') {
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

  const applyDigits = (next: string[]) => {
    setDigits(next)
    setError('')
    if (next.every(Boolean)) void onCode(undefined, next.join(''))
  }

  const setDigit = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    applyDigits(next)
    if (digit && index < 5) codeRefs.current[index + 1]?.focus()
  }

  const onDigitKey = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="mt-8">
      <div id="firebase-recaptcha" />
      {step === 'phone' && (
        <form onSubmit={onPhone} className="flex flex-col gap-4">
          <label htmlFor="phone" className="block">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-muted">Phone number</span>
            <span className="mt-2 flex h-12 border border-brand-line focus-within:border-brand-gold-deep focus-within:ring-1 focus-within:ring-brand-gold-deep">
              <span className="flex items-center border-r border-brand-line px-3 text-sm font-semibold text-brand-ink">+256</span>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                autoFocus
                placeholder="772 000 000"
                value={formatLocal(phone)}
                onChange={(event) => { setPhone(event.target.value); setError('') }}
                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-brand-ink outline-none placeholder:text-[#9aa49f]"
              />
            </span>
          </label>
          <p className="text-xs leading-5 text-brand-muted">We will text a 6-digit code. This is the fastest way into your account.</p>
          <button disabled={pending} className="h-12 bg-brand-ink text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-brand-ink/90 disabled:opacity-60">
            {pending ? 'Sending code' : 'Continue'}
          </button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={onCode} className="flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-muted">Verification code</p>
            <p className="mt-2 text-sm text-brand-muted">Sent to {phone}.</p>
          </div>
          <div className="flex justify-between gap-2" onPaste={(event) => {
            const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
            if (!pasted) return
            event.preventDefault()
            const next = Array.from({ length: 6 }, (_, index) => pasted[index] ?? '')
            applyDigits(next)
            codeRefs.current[Math.min(pasted.length, 5)]?.focus()
          }}>
            {Array.from({ length: 6 }, (_, index) => (
              <input
                key={index}
                ref={(node) => { codeRefs.current[index] = node }}
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                aria-label={`Digit ${index + 1}`}
                maxLength={1}
                value={digits[index]}
                onChange={(event) => setDigit(index, event.target.value)}
                onKeyDown={(event) => onDigitKey(index, event)}
                className="h-14 w-full border border-brand-line text-center font-serif text-2xl text-brand-ink outline-none focus:border-brand-gold-deep focus:ring-1 focus:ring-brand-gold-deep"
              />
            ))}
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={pending || code.length !== 6} className="h-12 bg-brand-ink text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-brand-ink/90 disabled:opacity-60">
            {pending ? 'Checking code' : 'Verify and continue'}
          </button>
          <div className="flex items-center justify-between text-xs">
            <button type="button" onClick={() => { setStep('phone'); setError(''); setDigits(['', '', '', '', '', '']) }} className="font-semibold uppercase tracking-[0.12em] text-brand-muted hover:text-brand-ink">
              Change number
            </button>
            <button
              type="button"
              disabled={pending || resendIn > 0}
              onClick={async () => {
                setPending(true)
                setError('')
                try {
                  await sendCode(phone)
                } catch (caught) {
                  setError(readableError(caught))
                } finally {
                  setPending(false)
                }
              }}
              className="font-semibold uppercase tracking-[0.12em] text-brand-gold-deep disabled:text-brand-muted"
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}

      {step === 'email' && (
        <form onSubmit={onEmail} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-muted">Email and password</p>
            <button type="button" onClick={() => { setStep('phone'); setError('') }} className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-gold-deep">
              Use phone
            </button>
          </div>
          {emailMode === 'create' && <input name="full_name" autoComplete="name" placeholder="Full name" className="field" />}
          <input name="email" type="email" required autoComplete="email" placeholder="Email address" className="field" />
          <input name="password" type="password" required minLength={8} autoComplete={emailMode === 'create' ? 'new-password' : 'current-password'} placeholder="Password" className="field" />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={pending} className="h-12 bg-brand-ink text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-brand-ink/90 disabled:opacity-60">
            {pending ? 'Please wait' : emailMode === 'sign-in' ? 'Sign in' : 'Create account'}
          </button>
          <button type="button" onClick={() => { setEmailMode(emailMode === 'sign-in' ? 'create' : 'sign-in'); setError('') }} className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-gold-deep">
            {emailMode === 'sign-in' ? 'Need an account? Create one' : 'Already registered? Sign in'}
          </button>
        </form>
      )}

      {step === 'phone' && (
        <div className="mt-8">
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">
            <span className="h-px flex-1 bg-brand-line" />
            Other ways
            <span className="h-px flex-1 bg-brand-line" />
          </div>
          <button type="button" onClick={() => { setStep('email'); setError('') }} className="mt-4 flex h-12 w-full items-center justify-center border border-brand-line text-xs font-bold uppercase tracking-[0.14em] text-brand-ink hover:border-brand-ink">
            Email and password
          </button>
          <button type="button" onClick={onGoogle} disabled={pending} className="mt-3 flex h-12 w-full items-center justify-center gap-3 border border-brand-line text-sm font-semibold text-brand-ink hover:border-brand-ink disabled:opacity-60">
            <GoogleMark />
            Continue with Google
          </button>
          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        </div>
      )}
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
