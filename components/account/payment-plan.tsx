'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import Link from 'next/link'
import { CheckCircle2, CreditCard, Smartphone, X } from 'lucide-react'
import { useProfile } from '@/components/account/profile-context'
import { StatusBadge } from '@/components/site/design-system'
import { recordPaymentAttempt } from '@/lib/actions'
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

const methods = [
  { id: 'mtn', label: 'MTN Mobile Money', detail: 'A prompt is sent to your MTN line.', kind: 'mobile' as const },
  { id: 'airtel', label: 'Airtel Money', detail: 'A prompt is sent to your Airtel line.', kind: 'mobile' as const },
  { id: 'card', label: 'Visa or Mastercard', detail: 'Card details stay with the provider.', kind: 'card' as const },
]

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
  const dueInstallment = rows.find((item) => item.status === 'Due soon' || item.status === 'Due')
  const [receiptReference, setReceiptReference] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [pending, setPending] = useState<PendingPayment | null>(null)
  const payButtonRef = useRef<HTMLButtonElement>(null)

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

  const recordPayment = (next: PendingPayment) => {
    setPending(next)
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      // The request still shows for this visit.
    }
  }

  const receipt = rows.find((item) => item.reference === receiptReference)

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric label="Received" value={summary.paid} note={`${rows.filter((item) => item.status === 'Paid').length} installments settled`} />
        <Metric label="Outstanding" value={summary.outstanding} note={pending ? 'Awaiting confirmation' : dueInstallment ? `Due ${dueInstallment.due}` : 'Nothing outstanding'} />
        <Metric label="Contract value" value={summary.total} note={activeService.reference || 'No active service'} />
      </div>

      {dueInstallment && (
        <section className="mt-8 border border-brand-line bg-brand-ink p-6 text-white md:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-light">{pending ? 'Awaiting confirmation' : 'Next payment'}</p>
              <p className="mt-3 font-serif text-4xl tracking-[-0.04em] md:text-5xl">{dueInstallment.amount}</p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                {pending
                  ? `${pending.method} is recorded against ${pending.reference}. ${pending.note} The balance changes after the provider confirms it.`
                  : `${dueInstallment.name} for ${activeService.title}. Due ${dueInstallment.due}.`}
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-gold-light"><span className="size-1.5 rounded-full bg-current" />{pending ? 'Processing' : dueInstallment.status}</span>
              {pending ? (
                <p className="text-xs text-white/50">{pending.reference}</p>
              ) : (
                <button ref={payButtonRef} type="button" onClick={() => setPaying(true)} className="inline-flex h-12 items-center justify-center bg-brand-gold px-5 text-xs font-bold uppercase tracking-[0.12em] text-brand-ink hover:bg-brand-gold-light">
                  Pay {dueInstallment.amount}
                </button>
              )}
            </div>
          </div>
          <div className="mt-8 h-1.5 bg-white/10">
            <div className="h-full bg-brand-gold" style={{ width: summary.paidWidth }} />
          </div>
          <p className="mt-3 text-xs text-white/45">{summary.paid} received of {summary.total}</p>
        </section>
      )}

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
          {rows.map((item, index) => {
            const processing = pending?.reference === item.reference
            const tone = item.status === 'Paid' ? 'green' : 'gold'
            const label = processing ? 'Processing' : item.status
            return (
              <div key={item.reference} className={`grid gap-3 px-5 py-5 md:grid-cols-[1.3fr_0.8fr_0.8fr_1fr_auto] md:items-center md:gap-4 md:px-6 ${item.status === 'Due soon' ? 'bg-brand-gold/10' : ''}`}>
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
                    <button type="button" onClick={() => setReceiptReference(item.reference)} className="text-[10px] font-bold uppercase tracking-wider text-brand-gold-deep hover:text-brand-ink">
                      Receipt
                    </button>
                  ) : processing ? null : (
                    <button type="button" onClick={() => setPaying(true)} className="text-[10px] font-bold uppercase tracking-wider text-brand-ink hover:text-brand-gold-deep">
                      Pay now
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p className="border-t border-brand-line px-5 py-4 text-xs leading-5 text-brand-muted md:px-6">
          Settled receipts stay with this plan. The latest one is also filed in <Link href="/account/documents" className="font-semibold text-brand-ink underline-offset-2 hover:underline">Documents</Link>.
        </p>
      </section>

      {paying && dueInstallment && (
        <PaymentDialog
          amount={dueInstallment.amount}
          due={dueInstallment.due}
          reference={dueInstallment.reference}
          onClose={() => {
            setPaying(false)
            payButtonRef.current?.focus()
          }}
          onRecorded={recordPayment}
        />
      )}
      {receipt && (
        <ReceiptDialog installment={receipt} serviceTitle={activeService.title} serviceReference={activeService.reference} onClose={() => setReceiptReference(null)} />
      )}
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

function PaymentDialog({
  amount,
  due,
  reference,
  onClose,
  onRecorded,
}: {
  amount: string
  due: string
  reference: string
  onClose: () => void
  onRecorded: (payment: PendingPayment) => void
}) {
  const { profile } = useProfile()
  const [methodId, setMethodId] = useState(methods[0].id)
  const [phone, setPhone] = useState(profile.phone)
  const [phoneEdited, setPhoneEdited] = useState(false)
  const [error, setError] = useState('')
  const [recorded, setRecorded] = useState<PendingPayment | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!phoneEdited) setPhone(profile.phone)
  }, [profile.phone, phoneEdited])

  useDialog(panelRef, closeRef, onClose)

  const method = methods.find((item) => item.id === methodId) ?? methods[0]

  const submit = async () => {
    const note = method.kind === 'mobile' ? `The prompt goes to ${phone.trim()}.` : 'Card details are collected by the provider.'
    if (method.kind === 'mobile' && phone.trim().length < 7) {
      setError('Enter the mobile money number that should receive the prompt.')
      return
    }
    const next = { reference, method: method.label, note, phone: phone.trim() }
    const result = await recordPaymentAttempt({ reference, method: method.label, phone: phone.trim(), note })
    if (result.error) {
      setError(result.error)
      return
    }
    setRecorded(next)
    onRecorded(next)
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5">
      <button type="button" aria-label="Close payment" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-[#0b1612]/60 backdrop-blur-[3px]" />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="payment-title" className="relative z-10 max-h-[92dvh] w-full max-w-lg overflow-y-auto bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-brand-line p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-deep">Secure payment</p>
            <h2 id="payment-title" className="mt-2 font-serif text-3xl tracking-[-0.03em]">{recorded ? 'Payment initiated' : 'Pay installment'}</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close payment" className="flex size-11 shrink-0 items-center justify-center border border-brand-line text-brand-ink hover:border-brand-ink">
            <X size={16} />
          </button>
        </div>
        {recorded ? (
          <div className="p-6">
            <CheckCircle2 className="text-brand-green" size={36} />
            <p className="mt-5 text-sm leading-6 text-brand-muted">
              Your {recorded.method} request is recorded against {recorded.reference}. {recorded.note} The installment stays outstanding until the provider confirms the transfer.
            </p>
            <dl className="mt-6 divide-y divide-brand-line border border-brand-line">
              <ReceiptRow label="Amount" value={amount} />
              <ReceiptRow label="Method" value={recorded.method} />
              <ReceiptRow label="Reference" value={recorded.reference} />
            </dl>
            <button type="button" onClick={onClose} className="mt-6 inline-flex h-12 w-full items-center justify-center bg-brand-ink text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90">
              Return to payments
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-end justify-between gap-4 bg-brand-surface p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">Amount due</p>
                <p className="mt-2 font-serif text-3xl tracking-[-0.03em]">{amount}</p>
              </div>
              <p className="text-right text-xs text-brand-muted">Due<br /><span className="font-semibold text-brand-ink">{due}</span></p>
            </div>
            <div className="mt-6" role="radiogroup" aria-label="Payment method">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">Payment method</p>
              <div className="mt-3 grid gap-2">
                {methods.map((item) => {
                  const selected = item.id === method.id
                  const Icon = item.kind === 'card' ? CreditCard : Smartphone
                  return (
                    <button key={item.id} type="button" role="radio" aria-checked={selected} onClick={() => { setMethodId(item.id); setError('') }} className={`flex items-center justify-between gap-3 border p-4 text-left ${selected ? 'border-brand-gold-deep bg-brand-gold/10' : 'border-brand-line hover:border-brand-ink'}`}>
                      <span className="flex items-center gap-3">
                        <Icon size={16} className="text-brand-gold-deep" />
                        <span>
                          <span className="block text-sm font-semibold">{item.label}</span>
                          <span className="mt-1 block text-xs text-brand-muted">{item.detail}</span>
                        </span>
                      </span>
                      <span className={`size-3 rounded-full border ${selected ? 'border-brand-gold-deep bg-brand-gold-deep' : 'border-brand-line'}`} />
                    </button>
                  )
                })}
              </div>
            </div>
            {method.kind === 'mobile' && (
              <label htmlFor="payment-phone" className="mt-5 block">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">Mobile money number</span>
                <input id="payment-phone" name="phone" type="tel" autoComplete="tel" value={phone} aria-invalid={error ? true : undefined} aria-describedby={error ? 'payment-phone-error' : undefined} onChange={(event) => { setPhoneEdited(true); setPhone(event.target.value); setError('') }} className="field mt-2" />
                {error && <span id="payment-phone-error" className="mt-2 block text-xs text-brand-gold-deep">{error}</span>}
              </label>
            )}
            {method.kind === 'card' && <p className="mt-5 text-xs leading-5 text-brand-muted">This portal records the request. The provider collects the card details, and they are not stored on your account.</p>}
            <button type="button" onClick={submit} className="mt-6 inline-flex h-12 w-full items-center justify-center bg-brand-gold text-xs font-bold uppercase tracking-[0.14em] text-brand-ink hover:bg-brand-gold-light">
              Continue securely
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ReceiptDialog({
  installment,
  serviceTitle,
  serviceReference,
  onClose,
}: {
  installment: PlanInstallment
  serviceTitle: string
  serviceReference: string
  onClose: () => void
}) {
  const { profile } = useProfile()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useDialog(panelRef, closeRef, onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5">
      <button type="button" aria-label="Close receipt" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-[#0b1612]/60 backdrop-blur-[3px]" />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="receipt-title" className="relative z-10 max-h-[92dvh] w-full max-w-lg overflow-y-auto bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-brand-line p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-deep">Mudogwaluyiira Group</p>
            <h2 id="receipt-title" className="mt-2 font-serif text-3xl tracking-[-0.03em]">Receipt</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close receipt" className="flex size-11 shrink-0 items-center justify-center border border-brand-line text-brand-ink hover:border-brand-ink">
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center justify-between gap-4 px-6 pt-6">
          <StatusBadge tone="green">Paid</StatusBadge>
          <p className="text-xs text-brand-muted">{installment.reference}</p>
        </div>
        <dl className="mt-4 divide-y divide-brand-line border-y border-brand-line">
          <ReceiptRow label="Received from" value={profile.name} />
          <ReceiptRow label="Service" value={serviceTitle} />
          <ReceiptRow label="Installment" value={installment.name} />
          <ReceiptRow label="Method" value={installment.method ?? 'Recorded payment'} />
          <ReceiptRow label="Date received" value={installment.paidOn ?? installment.due} />
          <ReceiptRow label="Service reference" value={serviceReference} />
        </dl>
        <div className="flex items-end justify-between gap-4 p-6">
          <p className="max-w-xs text-xs leading-5 text-brand-muted">This confirms the installment was received and applied to your construction account.</p>
          <p className="font-serif text-2xl tracking-[-0.03em]">{installment.amount}</p>
        </div>
        {installment.reference === 'TXN-2048' && (
          <div className="border-t border-brand-line px-6 py-4">
            <Link href="/account/documents" className="text-[10px] font-bold uppercase tracking-wider text-brand-gold-deep hover:text-brand-ink">Open in documents</Link>
          </div>
        )}
      </div>
    </div>
  )
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-6 py-3 text-sm">
      <dt className="text-brand-muted">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  )
}

function useDialog(panelRef: RefObject<HTMLDivElement | null>, closeRef: RefObject<HTMLButtonElement | null>, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((element) => !element.hasAttribute('disabled'))
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

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [closeRef, panelRef])
}
