'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, Smartphone, X } from 'lucide-react'
import { refreshOpenPayment, startOpenPayment } from '@/lib/actions'
import { suggestedNetwork, ugandaMobile } from '@/lib/payments/phone'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type OpenPayment = {
  reference: string
  email: string
  phone: string
  amount: string
  method: string
  created: boolean
  status: 'pending' | 'paid' | 'failed'
}

export function PayButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pay-button fixed bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+4.25rem)] right-[max(1.25rem,env(safe-area-inset-right))] z-30 uppercase"
      >
        <span className="pay-button-spin pay-button-glow" aria-hidden="true" />
        <span className="pay-button-spin" aria-hidden="true" />
        <span className="pay-button-face">
          <span className="pay-button-mark">
            <Smartphone size={18} strokeWidth={2.25} />
            Pay
          </span>
        </span>
      </button>
      {open && <PayDialog onClose={() => setOpen(false)} />}
    </>
  )
}

function PayDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [network, setNetwork] = useState<'mtnmomo' | 'airtel'>('mtnmomo')
  const [networkTouched, setNetworkTouched] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<OpenPayment | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (networkTouched) return
    const detected = suggestedNetwork(ugandaMobile(phone))
    if (detected) setNetwork(detected)
  }, [phone, networkTouched])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  useEffect(() => {
    if (!result || 'error' in result || result.status !== 'pending') return
    let attempts = 0
    const timer = window.setInterval(async () => {
      attempts += 1
      const next = await refreshOpenPayment(result.reference)
      if ('status' in next && (next.status === 'paid' || next.status === 'failed')) {
        setResult({ ...result, status: next.status })
        window.clearInterval(timer)
      } else if (attempts >= 12) {
        window.clearInterval(timer)
      }
    }, 4000)
    return () => window.clearInterval(timer)
  }, [result])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!emailPattern.test(email.trim())) {
      setError('Enter an email.')
      return
    }
    if (!ugandaMobile(phone)) {
      setError('Enter a phone number.')
      return
    }
    const digits = amount.replace(/[^\d]/g, '')
    const value = Number(digits)
    if (!digits || value < 500 || value > 50_000_000) {
      setError('Enter UGX 500 to 50,000,000.')
      return
    }
    setPending(true)
    setError('')
    const next = await startOpenPayment({ email, phone, amount, network })
    setPending(false)
    if ('error' in next) {
      setError(next.error ?? 'Could not start.')
      return
    }
    setResult(next)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5">
      <button type="button" aria-label="Close payment" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-[#0f1c17]/80" />
      <div role="dialog" aria-modal="true" aria-labelledby="home-pay-title" className="relative z-10 max-h-[92dvh] w-full max-w-lg overflow-y-auto bg-[#f7f7f5] p-7 text-[#15251f] md:p-10">
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close payment" className="absolute right-5 top-5 flex size-11 items-center justify-center">
          <X />
        </button>
        {result ? (
          <div className="py-6">
            <div className="flex size-14 items-center justify-center bg-[#dce9df] text-[#28704d]"><Check /></div>
            <h2 id="home-pay-title" className="mt-6 font-serif text-3xl tracking-[-0.03em]">
              {result.status === 'paid' ? 'Paid' : result.status === 'failed' ? 'Not paid' : 'Check your phone'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#65736d]">
              {result.status === 'pending' && `Approve the prompt on ${result.phone}. `}
              {result.status === 'paid' && `${result.amount} paid. `}
              {result.status === 'failed' && 'Try again. '}
              {result.created ? `Account ready for ${result.email}.` : `Saved to ${result.email}.`}
            </p>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.15em] text-[#b48b45]">{result.reference} · {result.amount}</p>
            <button type="button" onClick={onClose} className="mt-8 inline-flex h-12 w-full items-center justify-center bg-[#15251f] text-xs font-bold uppercase tracking-[0.16em] text-white hover:bg-[#263f35]">Close</button>
          </div>
        ) : (
          <>
            <h2 id="home-pay-title" className="font-serif text-3xl tracking-[-0.03em]">Pay to MuddoGroup</h2>
            <form onSubmit={submit} className="mt-7 flex flex-col gap-4" noValidate>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#65736d]">Amount</span>
                <input value={amount} onChange={(event) => { setAmount(event.target.value); setError('') }} inputMode="numeric" autoComplete="transaction-amount" className="field mt-2" placeholder="50000" />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#65736d]">Phone</span>
                <input value={phone} onChange={(event) => { setPhone(event.target.value); setError('') }} type="tel" autoComplete="tel" className="field mt-2" placeholder="0772 000 000" />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#65736d]">Email</span>
                <input value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} type="email" autoComplete="email" className="field mt-2" placeholder="you@email.com" />
              </label>
              <fieldset>
                <legend className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#65736d]">Network</legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {([['mtnmomo', 'MTN'], ['airtel', 'Airtel']] as const).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={network === id}
                      onClick={() => { setNetworkTouched(true); setNetwork(id); setError('') }}
                      className={`h-12 border text-xs font-bold uppercase tracking-[0.12em] ${network === id ? 'border-[#15251f] bg-[#15251f] text-white' : 'border-[#d9ddd8] bg-white text-[#15251f]'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              {error && <p className="text-sm text-[#8a3b2b]" role="alert">{error}</p>}
              <button type="submit" disabled={pending} className="mt-2 inline-flex h-12 items-center justify-center bg-[#c9a45c] text-xs font-bold uppercase tracking-[0.16em] text-[#15251f] hover:bg-[#dbbd7e] disabled:opacity-60">
                {pending ? 'Sending…' : 'Pay'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
