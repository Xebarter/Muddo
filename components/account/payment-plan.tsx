'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, CreditCard, Smartphone } from 'lucide-react'
import { useProfile } from '@/components/account/profile-context'
import { StatusBadge } from '@/components/site/design-system'
import { refreshMobileMoneyPayment, refreshOpenPayment, startAccountAmountPayment, startCardPayment, startMobileMoneyPayment } from '@/lib/actions'
import { receiptHref, saveReceipt } from '@/lib/save-receipt'
import { installments as demoInstallments, paymentSummary as demoSummary, service as demoService } from '@/lib/account'

const storageKey = 'muddo-account-payment'

export type PlanInstallment = {
  id: string
  name: string
  amount: string
  due: string
  paidOn?: string
  method?: string
  status: string
  tone: 'gold' | 'green' | 'muted'
  reference: string
}

const fallbackRows: PlanInstallment[] = demoInstallments.map((item) => ({ ...item, id: item.reference }))

type PendingPayment = { reference: string; method: string; note: string; phone: string }

export function PaymentPlan({
  rows = fallbackRows,
  summary = demoSummary,
  activeService = { title: demoService.title, reference: demoService.reference },
}: {
  rows?: PlanInstallment[]
  summary?: typeof demoSummary
  activeService?: { title: string; reference: string }
}) {
  const dueInstallment = rows.find((item) => item.status === 'Due soon' || item.status === 'Due' || item.status === 'Pending' || item.status === 'Failed')
  const [chosen, setChosen] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingPayment | null>(null)
  const router = useRouter()
  const selected = rows.find((item) => item.reference === chosen && item.status !== 'Paid') ?? dueInstallment
  const awaitingConfirmation = selected?.status === 'Pending' || pending?.reference === selected?.reference

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(storageKey)
      if (!stored) return
      const parsed = JSON.parse(stored) as Partial<PendingPayment>
      if (typeof parsed.reference === 'string' && parsed.reference === dueInstallment?.reference && typeof parsed.method === 'string' && typeof parsed.note === 'string') {
        setPending({ reference: parsed.reference, method: parsed.method, note: parsed.note, phone: typeof parsed.phone === 'string' ? parsed.phone : '' })
      }
    } catch {
      // Keep the published plan when a stored request cannot be read.
    }
  }, [])

  useEffect(() => {
    if (!pending) return
    let stopped = false
    const tick = async () => {
      const result = await refreshMobileMoneyPayment(pending.reference)
      if (stopped || !result.state || result.state === 'pending') return
      setPending(null)
      try { sessionStorage.removeItem(storageKey) } catch { /* The refreshed plan is enough. */ }
      router.refresh()
    }
    const timer = window.setInterval(tick, 4000)
    void tick()
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [pending, router])

  const recordPayment = (next: PendingPayment) => {
    setPending(next)
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      // The request still shows for this visit.
    }
  }

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric label="Received" value={summary.paid} note={`${rows.filter((item) => item.status === 'Paid').length} paid`} />
        <Metric label="Outstanding" value={summary.outstanding} note={awaitingConfirmation ? 'Waiting' : dueInstallment ? `Due ${dueInstallment.due}` : 'Clear'} />
        <Metric label="Total" value={summary.total} note={activeService.reference || 'None'} />
      </div>

      <section id="account-pay" className="mt-8 scroll-mt-24 border border-brand-line bg-white">
        <div className="grid lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
          <div className="bg-brand-ink p-6 text-white md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-light">{awaitingConfirmation ? 'Waiting' : 'Pay now'}</p>
            <p className="mt-3 font-serif text-4xl tracking-[-0.04em] md:text-5xl">{selected ? selected.amount : 'Make a payment'}</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">
              {selected ? `${selected.name}. Due ${selected.due}.` : 'Pay by Mobile Money or card. The receipt stays on your profile.'}
            </p>
            <p className="mt-6 text-xs leading-5 text-white/50">{activeService.title}</p>
            {selected && <p className="mt-1 text-xs text-white/40">{selected.reference}</p>}
            <div className="mt-8 h-1.5 bg-white/10">
              <div className="h-full bg-brand-gold" style={{ width: summary.paidWidth }} />
            </div>
            <p className="mt-3 text-xs text-white/45">{summary.paid} of {summary.total}</p>
          </div>
          {selected ? (
            <PaymentForm
              key={selected.reference}
              amount={selected.amount}
              due={selected.due}
              reference={selected.reference}
              pending={pending?.reference === selected.reference
                ? pending
                : selected.status === 'Pending'
                  ? { reference: selected.reference, method: selected.method || 'Mobile Money', note: selected.method === 'Card' ? 'Confirm the payment with your bank.' : 'Waiting for confirmation.', phone: '' }
                  : null}
              onRecorded={recordPayment}
              onResolved={(state) => {
                if (state !== 'failed') return
                setPending(null)
                try { sessionStorage.removeItem(storageKey) } catch { /* The plan still refreshes from the account. */ }
              }}
            />
          ) : (
            <AmountPaymentForm />
          )}
        </div>
      </section>

      <section className="mt-8 border border-brand-line bg-white">
        <div className="flex items-end justify-between gap-4 border-b border-brand-line px-5 py-5 md:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">Statement</p>
            <h2 className="mt-2 font-serif text-2xl">Installments</h2>
          </div>
          <p className="text-xs text-brand-muted">{activeService.reference}</p>
        </div>
        <div className="hidden grid-cols-[1.3fr_0.8fr_0.8fr_1fr_auto] gap-4 border-b border-brand-line px-6 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted md:grid">
          <span>Installment</span>
          <span>Date</span>
          <span>Reference</span>
          <span>Amount</span>
          <span className="text-right">Status</span>
        </div>
        <div className="divide-y divide-brand-line">
          {rows.length === 0 && <p className="px-5 py-6 text-sm text-brand-muted md:px-6">No installments yet. Use the form above to pay.</p>}
          {rows.map((item, index) => {
            const processing = pending?.reference === item.reference
            const tone = item.status === 'Paid' ? 'green' : 'gold'
            const label = processing ? 'Processing' : item.status
            return (
              <div key={item.reference} className={`grid gap-3 px-5 py-5 md:grid-cols-[1.3fr_0.8fr_0.8fr_1fr_auto] md:items-center md:gap-4 md:px-6 ${item.reference === selected?.reference ? 'bg-brand-gold/10' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center bg-brand-surface text-xs font-semibold text-brand-muted">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="mt-1 text-xs text-brand-muted md:hidden">{item.reference}</p>
                  </div>
                </div>
                <p className="text-sm text-brand-muted">{item.status === 'Paid' && item.paidOn ? `Paid ${item.paidOn}` : `Due ${item.due}`}</p>
                <p className="hidden text-sm text-brand-muted md:block">{item.reference}</p>
                <p className="text-sm font-semibold">{item.amount}</p>
                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <StatusBadge tone={tone}>{label}</StatusBadge>
                  {item.status === 'Paid' ? (
                    <a href={receiptHref(item.reference)} className="text-[10px] font-bold uppercase tracking-wider text-brand-gold-deep hover:text-brand-ink">
                      Receipt
                    </a>
                  ) : processing || item.status === 'Pending' ? null : (
                    <button type="button" onClick={() => { setChosen(item.reference); document.getElementById('account-pay')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} className="text-[10px] font-bold uppercase tracking-wider text-brand-ink hover:text-brand-gold-deep">
                      {item.reference === selected?.reference ? 'Selected' : 'Pay'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p className="border-t border-brand-line px-5 py-4 text-xs leading-5 text-brand-muted md:px-6">
          Paid receipts stay on your <Link href="/account/profile" className="font-semibold text-brand-ink underline-offset-2 hover:underline">profile</Link>.
        </p>
      </section>

    </>
  )
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="border border-brand-line bg-white p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted">{label}</p>
      <p className="mt-4 font-serif text-2xl tracking-[-0.03em] sm:text-3xl">{value}</p>
      <p className="mt-2 text-xs text-brand-muted">{note}</p>
    </div>
  )
}

function PaymentForm({
  amount,
  due,
  reference,
  pending,
  onRecorded,
  onResolved,
}: {
  amount: string
  due: string
  reference: string
  pending: PendingPayment | null
  onRecorded: (payment: PendingPayment) => void
  onResolved: (state: 'paid' | 'failed') => void
}) {
  const { profile } = useProfile()
  const router = useRouter()
  const [phone, setPhone] = useState(profile.phone)
  const [phoneEdited, setPhoneEdited] = useState(false)
  const [method, setMethod] = useState<'mobile' | 'card'>('mobile')
  const [cardName, setCardName] = useState(profile.name)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const cardFormRef = useRef<HTMLFormElement>(null)
  const [recorded, setRecorded] = useState<PendingPayment | null>(pending)
  const [outcome, setOutcome] = useState<'pending' | 'paid' | 'failed'>('pending')
  const savedReceipt = useRef(false)

  useEffect(() => {
    if (!phoneEdited) setPhone(profile.phone)
  }, [profile.phone, phoneEdited])

  useEffect(() => {
    if (pending) setRecorded(pending)
  }, [pending])

  const onResolvedRef = useRef(onResolved)
  onResolvedRef.current = onResolved

  useEffect(() => {
    if (!recorded || outcome !== 'pending') return
    let stopped = false
    const tick = async () => {
      const result = await refreshMobileMoneyPayment(reference)
      if (stopped || !result.state || result.state === 'pending') return
      setOutcome(result.state)
      onResolvedRef.current(result.state)
      router.refresh()
    }
    const timer = window.setInterval(tick, 4000)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [recorded, outcome, reference, router])

  useEffect(() => {
    if (outcome !== 'paid' || savedReceipt.current) return
    savedReceipt.current = true
    saveReceipt(reference)
  }, [outcome, reference])

  const submit = async () => {
    if (method === 'card') {
      const cardError = cardProblem(cardName, cardNumber, cardExpiry, cardCvc)
      if (cardError) {
        setError(cardError)
        return
      }
      setSubmitting(true)
      const result = await startCardPayment({ reference })
      if (result.error || !result.checkoutUrl || !cardFormRef.current) {
        setSubmitting(false)
        setError(result.error || 'The card payment could not be started.')
        return
      }
      const next = { reference, method: 'Card', note: 'Confirm the payment with your bank.', phone: '' }
      try { sessionStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* The return page can still refresh the plan. */ }
      cardFormRef.current.action = result.checkoutUrl
      cardFormRef.current.submit()
      onRecorded(next)
      setError('')
      return
    }
    if (phone.trim().length < 7) {
      setError('Enter a phone number.')
      return
    }
    setSubmitting(true)
    const result = await startMobileMoneyPayment({ reference, phone: phone.trim() })
    setSubmitting(false)
    if (result.error || !result.state) {
      setError(result.error || 'Could not start.')
      return
    }
    const next = { reference, method: 'Mobile Money', note: 'Approve the prompt on your phone.', phone: phone.trim() }
    setOutcome('pending')
    setRecorded(next)
    onRecorded(next)
    setError('')
  }

  return (
    <div className="p-6 md:p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-deep">How to pay</p>
      <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em]">{outcome === 'paid' ? 'Paid' : recorded ? (recorded.method === 'Card' ? 'Confirm with your bank' : 'Check your phone') : 'Choose a method'}</h2>
      {recorded ? (
          <div className="mt-6">
            <CheckCircle2 className={outcome === 'failed' ? 'text-brand-gold-deep' : 'text-brand-green'} size={36} />
            <p className="mt-5 text-sm leading-6 text-brand-muted">
              {outcome === 'paid'
                ? 'Paid. Your receipt is downloading.'
                : outcome === 'failed'
                  ? 'Not paid. Try again.'
                  : recorded?.method === 'Card'
                    ? 'Your bank will ask you to confirm this card payment.'
                    : 'Approve the prompt on your phone.'}
            </p>
            <dl className="mt-6 divide-y divide-brand-line border border-brand-line">
              <ReceiptRow label="Amount" value={amount} />
              <ReceiptRow label="Method" value={recorded.method} />
              <ReceiptRow label="Reference" value={recorded.reference} />
            </dl>
            {outcome === 'failed' ? (
              <button type="button" onClick={() => setRecorded(null)} className="mt-6 inline-flex h-12 w-full items-center justify-center bg-brand-gold text-xs font-bold uppercase tracking-[0.12em] text-brand-ink hover:bg-brand-gold-light">
                Try again
              </button>
            ) : (
              <div className="mt-6 flex flex-col gap-3">
                {outcome === 'paid' && (
                  <a href={receiptHref(reference)} className="inline-flex h-12 w-full items-center justify-center bg-brand-gold text-xs font-bold uppercase tracking-[0.12em] text-brand-ink hover:bg-brand-gold-light">
                    Download receipt
                  </a>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-sm leading-6 text-brand-muted">Due {due}. The charge is {amount}.</p>
            <div className="mt-5 grid grid-cols-2 border border-brand-line">
              <button type="button" aria-pressed={method === 'mobile'} onClick={() => { setMethod('mobile'); setError('') }} className={`flex h-12 items-center justify-center gap-2 px-2 text-[10px] font-bold uppercase tracking-[0.08em] sm:text-xs sm:tracking-[0.12em] ${method === 'mobile' ? 'bg-brand-ink text-white' : 'bg-white text-brand-muted'}`}>
                <Smartphone size={15} /> Mobile Money
              </button>
              <button type="button" aria-pressed={method === 'card'} onClick={() => { setMethod('card'); setError('') }} className={`flex h-12 items-center justify-center gap-2 px-2 text-[10px] font-bold uppercase tracking-[0.08em] sm:text-xs sm:tracking-[0.12em] ${method === 'card' ? 'bg-brand-ink text-white' : 'bg-white text-brand-muted'}`}>
                <CreditCard size={15} /> Card
              </button>
            </div>
            {method === 'mobile' ? (
              <label htmlFor="payment-phone" className="mt-5 block">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">Phone</span>
                <input id="payment-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" value={phone} aria-invalid={error ? true : undefined} aria-describedby={error ? 'payment-phone-error' : undefined} onChange={(event) => { setPhoneEdited(true); setPhone(event.target.value); setError('') }} className="field mt-2" style={{ fontSize: '16px' }} />
                <span className="mt-2 block text-xs leading-5 text-brand-muted">A prompt is sent to this MTN or Airtel number.</span>
              </label>
            ) : (
              <div className="mt-5 grid gap-4">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">Name on card</span>
                  <input value={cardName} onChange={(event) => { setCardName(event.target.value); setError('') }} autoComplete="cc-name" className="field mt-2" style={{ fontSize: '16px' }} />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">Card number</span>
                  <input value={cardNumber} onChange={(event) => { setCardNumber(formatCardNumber(event.target.value)); setError('') }} inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" className="field mt-2" style={{ fontSize: '16px' }} />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">Expiry</span>
                    <input value={cardExpiry} onChange={(event) => { setCardExpiry(formatExpiry(event.target.value)); setError('') }} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" className="field mt-2" style={{ fontSize: '16px' }} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">Security code</span>
                    <input value={cardCvc} onChange={(event) => { setCardCvc(event.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }} inputMode="numeric" autoComplete="cc-csc" placeholder="123" className="field mt-2" style={{ fontSize: '16px' }} />
                  </label>
                </div>
                <p className="text-xs leading-5 text-brand-muted">Your bank confirms the card. The amount is {amount}.</p>
              </div>
            )}
            {error && <p id="payment-phone-error" className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
            <button type="button" onClick={submit} disabled={submitting} className="mt-6 inline-flex h-12 w-full items-center justify-center bg-brand-gold text-xs font-bold uppercase tracking-[0.14em] text-brand-ink hover:bg-brand-gold-light disabled:opacity-60">
              {submitting ? 'Sending…' : `Pay ${amount}`}
            </button>
            <form ref={cardFormRef} method="POST" className="hidden">
              <input type="hidden" name="cardholder_name" value={cardName.trim()} readOnly />
              <input type="hidden" name="card_number" value={cardNumber} readOnly />
              <input type="hidden" name="expires" value={cardExpiry} readOnly />
              <input type="hidden" name="cvc" value={cardCvc} readOnly />
            </form>
          </div>
        )}
    </div>
  )
}

function AmountPaymentForm() {
  const { profile } = useProfile()
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState(profile.phone)
  const [phoneEdited, setPhoneEdited] = useState(false)
  const [method, setMethod] = useState<'mobile' | 'card'>('mobile')
  const [cardName, setCardName] = useState(profile.name)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [waiting, setWaiting] = useState('')
  const cardFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!phoneEdited) setPhone(profile.phone)
  }, [profile.phone, phoneEdited])

  useEffect(() => {
    if (!waiting) return
    let stopped = false
    const tick = async () => {
      const result = await refreshOpenPayment(waiting)
      if (stopped || !('status' in result) || result.status === 'pending') return
      if (result.status === 'paid') saveReceipt(waiting, result.receiptToken)
      setWaiting('')
      router.refresh()
    }
    const timer = window.setInterval(tick, 4000)
    void tick()
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [waiting, router])

  const submit = async () => {
    const digits = amount.replace(/[^\d]/g, '')
    if (!digits || Number(digits) < 500) {
      setError('Enter UGX 500 or more.')
      return
    }
    if (method === 'card') {
      const cardError = cardProblem(cardName, cardNumber, cardExpiry, cardCvc)
      if (cardError) {
        setError(cardError)
        return
      }
    } else if (phone.trim().length < 7) {
      setError('Enter a phone number.')
      return
    }
    setSubmitting(true)
    const result = await startAccountAmountPayment({ method, amount: digits, phone: phone.trim() })
    if (result.error || (method === 'card' && !result.checkoutUrl)) {
      setSubmitting(false)
      setError(result.error || 'The payment could not be started.')
      return
    }
    if (result.checkoutUrl && cardFormRef.current) {
      try { sessionStorage.setItem(storageKey, JSON.stringify({ reference: result.reference, method: 'Card', note: 'Confirm the payment with your bank.', phone: '' })) } catch { /* The receipt is still on the profile after sign-in. */ }
      cardFormRef.current.action = result.checkoutUrl
      cardFormRef.current.submit()
      return
    }
    setSubmitting(false)
    setWaiting(result.reference || '')
    setError('')
  }

  return (
    <div className="p-6 md:p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-deep">How to pay</p>
      <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em]">{waiting ? 'Check your phone' : 'Choose a method'}</h2>
      {waiting ? (
        <div className="mt-6">
          <CheckCircle2 className="text-brand-green" size={36} />
          <p className="mt-5 text-sm leading-6 text-brand-muted">Approve the prompt on your phone. This page updates when the payment is confirmed.</p>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-brand-gold-deep">{waiting}</p>
        </div>
      ) : (
        <div className="mt-6">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">Amount (UGX)</span>
            <input value={amount} onChange={(event) => { setAmount(event.target.value.replace(/[^\d]/g, '')); setError('') }} inputMode="numeric" autoComplete="transaction-amount" placeholder="50000" className="field mt-2" style={{ fontSize: '16px' }} />
          </label>
          <div className="mt-5 grid grid-cols-2 border border-brand-line">
            <button type="button" aria-pressed={method === 'mobile'} onClick={() => { setMethod('mobile'); setError('') }} className={`flex h-12 items-center justify-center gap-2 px-2 text-[10px] font-bold uppercase tracking-[0.08em] sm:text-xs sm:tracking-[0.12em] ${method === 'mobile' ? 'bg-brand-ink text-white' : 'bg-white text-brand-muted'}`}>
              <Smartphone size={15} /> Mobile Money
            </button>
            <button type="button" aria-pressed={method === 'card'} onClick={() => { setMethod('card'); setError('') }} className={`flex h-12 items-center justify-center gap-2 px-2 text-[10px] font-bold uppercase tracking-[0.08em] sm:text-xs sm:tracking-[0.12em] ${method === 'card' ? 'bg-brand-ink text-white' : 'bg-white text-brand-muted'}`}>
              <CreditCard size={15} /> Card
            </button>
          </div>
          {method === 'mobile' ? (
            <label className="mt-5 block">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">Phone</span>
              <input value={phone} onChange={(event) => { setPhoneEdited(true); setPhone(event.target.value); setError('') }} type="tel" autoComplete="tel" inputMode="tel" className="field mt-2" style={{ fontSize: '16px' }} />
              <span className="mt-2 block text-xs leading-5 text-brand-muted">A prompt is sent to this MTN or Airtel number.</span>
            </label>
          ) : (
            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">Name on card</span>
                <input value={cardName} onChange={(event) => { setCardName(event.target.value); setError('') }} autoComplete="cc-name" className="field mt-2" style={{ fontSize: '16px' }} />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">Card number</span>
                <input value={cardNumber} onChange={(event) => { setCardNumber(formatCardNumber(event.target.value)); setError('') }} inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" className="field mt-2" style={{ fontSize: '16px' }} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">Expiry</span>
                  <input value={cardExpiry} onChange={(event) => { setCardExpiry(formatExpiry(event.target.value)); setError('') }} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" className="field mt-2" style={{ fontSize: '16px' }} />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">Security code</span>
                  <input value={cardCvc} onChange={(event) => { setCardCvc(event.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }} inputMode="numeric" autoComplete="cc-csc" placeholder="123" className="field mt-2" style={{ fontSize: '16px' }} />
                </label>
              </div>
              <p className="text-xs leading-5 text-brand-muted">Your bank confirms the card.</p>
            </div>
          )}
          {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
          <button type="button" onClick={submit} disabled={submitting} className="mt-6 inline-flex h-12 w-full items-center justify-center bg-brand-gold text-xs font-bold uppercase tracking-[0.14em] text-brand-ink hover:bg-brand-gold-light disabled:opacity-60">
            {submitting ? 'Sending…' : 'Pay'}
          </button>
          <form ref={cardFormRef} method="POST" className="hidden">
            <input type="hidden" name="cardholder_name" value={cardName.trim()} readOnly />
            <input type="hidden" name="card_number" value={cardNumber} readOnly />
            <input type="hidden" name="expires" value={cardExpiry} readOnly />
            <input type="hidden" name="cvc" value={cardCvc} readOnly />
          </form>
        </div>
      )}
    </div>
  )
}

function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function cardProblem(name: string, number: string, expiry: string, cvc: string) {
  const digits = number.replace(/\D/g, '')
  if (name.trim().length < 2) return 'Enter the name on the card.'
  if (digits.length < 13 || digits.length > 19 || !luhn(digits)) return 'Enter a valid card number.'
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry)
  if (!match) return 'Enter the expiry as MM/YY.'
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  const now = new Date()
  const expired = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)
  if (month < 1 || month > 12 || expired) return 'Enter a current expiry date.'
  if (!/^\d{3,4}$/.test(cvc)) return 'Enter the security code.'
  return ''
}

function luhn(digits: string) {
  let sum = 0
  let alternate = false
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let value = Number(digits[index])
    if (alternate) {
      value *= 2
      if (value > 9) value -= 9
    }
    sum += value
    alternate = !alternate
  }
  return sum % 10 === 0
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-6 py-3 text-sm">
      <dt className="text-brand-muted">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  )
}

