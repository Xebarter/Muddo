'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { finishSave, useAdminProgress } from '@/components/admin/save-progress'
import { StatusBadge } from '@/components/site/design-system'
import { deleteInstallment, deleteMobilePayment, saveInstallment, saveMobilePayment } from '@/lib/actions'
import { formatUgandaPhone } from '@/lib/contact'
import { formatLongDate, formatUgx, installmentLabel, installmentStatuses, receiptStatuses } from '@/lib/format'
import type { LedgerInstallment, LedgerReceipt, PaymentLedgerData } from '@/lib/data'

const methods = ['Mobile Money', 'Bank transfer', 'Cash', 'Cheque']

const fieldClass = 'h-12 w-full border border-brand-line bg-white px-3 text-base font-medium normal-case tracking-normal text-brand-ink outline-none focus:border-brand-ink md:h-11 md:text-sm'

type DeskTab = 'installments' | 'receipts'

export function PaymentDesk({ ledger }: { ledger: PaymentLedgerData | null }) {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [tab, setTab] = useState<DeskTab>('installments')
  const { pending, track } = useAdminProgress()

  if (!ledger) {
    return <p className="mt-8 border border-dashed border-brand-line bg-white px-6 py-8 text-sm text-brand-muted">Payments could not be loaded. Refresh and try again.</p>
  }

  const run = (task: () => Promise<{ error?: string }>, done: string) => {
    setError('')
    setNotice('')
    void track((report) => finishSave(report, task)).then((result) => {
      if (result.error) setError(result.error)
      else setNotice(done)
    })
  }

  const choose = (next: DeskTab) => {
    setTab(next)
    setError('')
    setNotice('')
  }

  const openPlans = ledger.installments.filter((item) => item.status !== 'paid').length
  const openReceipts = ledger.receipts.filter((item) => item.status === 'pending').length

  const tabs: { id: DeskTab; label: string; count: number; attention: number }[] = [
    { id: 'installments', label: 'Installments', count: ledger.installments.length, attention: openPlans },
    { id: 'receipts', label: 'Receipts', count: ledger.receipts.length, attention: openReceipts },
  ]

  return (
    <div className="mt-8">
      <section className="grid overflow-hidden border border-brand-ink bg-brand-ink text-white sm:grid-cols-3">
        <Figure index={0} label="Collected" value={formatUgx(ledger.collected)} note="Paid installments and receipts" />
        <Figure index={1} label="Outstanding" value={formatUgx(ledger.outstanding)} note="Still to collect" />
        <Figure index={2} label="Open" value={String(openPlans + openReceipts)} note={`${openPlans} plans · ${openReceipts} receipts`} />
      </section>

      <div className="sticky top-20 z-20 -mx-5 mt-8 border-b border-brand-line bg-brand-surface/95 px-5 backdrop-blur-md md:-mx-10 md:px-10">
        <div role="tablist" aria-label="Payment records" className="flex gap-1 overflow-x-auto">
          {tabs.map((item) => {
            const selected = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`payments-tab-${item.id}`}
                aria-selected={selected}
                aria-controls={`payments-panel-${item.id}`}
                onClick={() => choose(item.id)}
                className={`flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-bold uppercase tracking-[0.14em] ${selected ? 'border-brand-ink text-brand-ink' : 'border-transparent text-brand-muted hover:text-brand-ink'}`}
              >
                {item.label}
                <span className={`min-w-5 px-1 text-[10px] tabular-nums ${selected ? 'text-brand-ink' : 'text-brand-muted'}`}>{item.count}</span>
                {item.attention > 0 && <span className="size-1.5 rounded-full bg-brand-gold-deep" aria-label={`${item.attention} open`} />}
              </button>
            )
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`payments-panel-${tab}`}
        aria-labelledby={`payments-tab-${tab}`}
        className="mt-6 border border-brand-line bg-white"
      >
        {error && <p className="border-b border-brand-line px-5 py-4 text-sm text-red-700" role="alert">{error}</p>}
        {notice && !error && <p className="border-b border-brand-line px-5 py-4 text-sm text-brand-muted" role="status">{notice}</p>}

        {tab === 'installments' && (
          <InstallmentBook
            rows={ledger.installments}
            services={ledger.services}
            pending={pending}
            onError={setError}
            onNotice={setNotice}
            onDelete={(id) => run(() => deleteInstallment(id), 'Installment deleted.')}
          />
        )}
        {tab === 'receipts' && (
          <ReceiptBook
            rows={ledger.receipts}
            customers={ledger.customers}
            pending={pending}
            onError={setError}
            onNotice={setNotice}
            onDelete={(id) => run(() => deleteMobilePayment(id), 'Receipt deleted.')}
          />
        )}
      </div>
    </div>
  )
}

function Figure({ index, label, value, note }: { index: number; label: string; value: string; note: string }) {
  return (
    <div className={`px-5 py-6 sm:px-6 sm:py-7 ${index > 0 ? 'border-t border-white/10 sm:border-t-0 sm:border-l' : ''}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-light">{label}</p>
      <p className="mt-3 font-serif text-2xl tracking-[-0.04em] tabular-nums sm:text-3xl">{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/45">{note}</p>
    </div>
  )
}

function InstallmentBook({
  rows,
  services,
  pending,
  onError,
  onNotice,
  onDelete,
}: {
  rows: LedgerInstallment[]
  services: PaymentLedgerData['services']
  pending: boolean
  onError: (value: string) => void
  onNotice: (value: string) => void
  onDelete: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [editing, setEditing] = useState<LedgerInstallment | 'new' | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const visible = useMemo(() => rows.filter((item) => {
    const haystack = `${item.customerName} ${item.serviceLabel} ${item.name} ${item.reference} ${item.method}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase()) && (status === 'all' || item.status === status)
  }), [rows, query, status])

  return (
    <>
      <PanelHead
        detail="Amounts a customer owes on a service. Paid rows appear on their account."
        action="New installment"
        onAction={() => { setEditing('new'); setConfirming(null); onError(''); onNotice('') }}
      />
      {editing && (
        <InstallmentForm
          item={editing === 'new' ? null : editing}
          services={services}
          onClose={() => setEditing(null)}
          onSaved={() => {
            onNotice(editing === 'new' ? 'Installment added.' : 'Installment saved.')
            onError('')
            setEditing(null)
          }}
        />
      )}
      <Toolbar
        query={query}
        onQuery={setQuery}
        label="Search installments"
        status={status}
        onStatus={setStatus}
        statuses={installmentStatuses.map((item) => ({ value: item, label: installmentLabel(item) }))}
        shown={visible.length}
        total={rows.length}
      />
      {rows.length === 0 ? (
        <Empty title="No installments yet." detail="Add the first payment on a customer service." />
      ) : visible.length === 0 ? (
        <Empty title="Nothing matches." detail="Try another name, reference, or status." action="Clear filters" onAction={() => { setQuery(''); setStatus('all') }} />
      ) : (
        <ol>
          {visible.map((item) => (
            <Row key={item.id}>
              <RowBody
                title={item.name}
                amount={formatUgx(item.amount)}
                line={`${item.customerName} · ${item.serviceLabel}`}
                meta={`Due ${formatLongDate(item.dueOn)}${item.paidOn ? ` · Paid ${formatLongDate(item.paidOn)}` : ''} · ${item.reference}${item.method ? ` · ${item.method}` : ''}`}
              />
              <RowTools>
                <StatusBadge tone={item.status === 'paid' ? 'green' : item.status === 'failed' ? 'muted' : 'gold'}>{installmentLabel(item.status)}</StatusBadge>
                <IconButton label="Edit installment" onClick={() => { setEditing(item); setConfirming(null); onError(''); onNotice('') }}><Pencil size={14} /></IconButton>
                {item.status !== 'paid' && (
                  <DeleteControl
                    confirming={confirming === item.id}
                    pending={pending}
                    ask="Delete this installment?"
                    onAsk={() => setConfirming(item.id)}
                    onCancel={() => setConfirming(null)}
                    onConfirm={() => onDelete(item.id)}
                  />
                )}
              </RowTools>
            </Row>
          ))}
        </ol>
      )}
    </>
  )
}

function InstallmentForm({
  item,
  services,
  onClose,
  onSaved,
}: {
  item: LedgerInstallment | null
  services: PaymentLedgerData['services']
  onClose: () => void
  onSaved: () => void
}) {
  const [serviceId, setServiceId] = useState(item?.serviceId ?? services[0]?.id ?? '')
  const [status, setStatus] = useState(item?.status ?? 'due')
  const [method, setMethod] = useState(item?.method ?? '')
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const { pending, track } = useAdminProgress()
  const methodChoices = method && !methods.includes(method) ? [...methods, method] : methods

  useEffect(() => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  return (
    <form
      ref={formRef}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        void track((report) => finishSave(report, () => saveInstallment(formData))).then((result) => {
          if (result.error) setError(result.error)
          else onSaved()
        })
      }}
      className="border-b border-brand-line bg-brand-surface"
    >
      <FormTitle title={item ? 'Edit installment' : 'New installment'} onClose={onClose} />
      <div className="grid gap-5 px-5 pb-6 sm:grid-cols-2 sm:px-6">
        <input type="hidden" name="id" value={item?.id ?? ''} />
        <Label text="Service" className="sm:col-span-2">
          <select name="service_id" value={serviceId} onChange={(event) => setServiceId(event.target.value)} className={fieldClass}>
            {services.length === 0 && <option value="">No services yet</option>}
            {services.map((service) => <option key={service.id} value={service.id}>{service.label}</option>)}
          </select>
        </Label>
        <Label text="Name">
          <input name="name" required defaultValue={item?.name ?? ''} placeholder="Deposit" className={fieldClass} />
        </Label>
        <Label text="Amount (UGX)">
          <input name="amount" inputMode="numeric" required defaultValue={item ? String(item.amount) : ''} placeholder="20000000" className={fieldClass} />
        </Label>
        <Label text="Due">
          <input name="due_on" type="date" required defaultValue={item?.dueOn ?? ''} className={fieldClass} />
        </Label>
        <Label text="Status">
          <select name="status" value={status} onChange={(event) => setStatus(event.target.value as LedgerInstallment['status'])} className={fieldClass}>
            {installmentStatuses.map((entry) => <option key={entry} value={entry}>{installmentLabel(entry)}</option>)}
          </select>
        </Label>
        <Label text="Method">
          <select name="method" value={method} onChange={(event) => setMethod(event.target.value)} className={fieldClass}>
            <option value="">Not set</option>
            {methodChoices.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
          </select>
        </Label>
        {status === 'paid' && (
          <Label text="Paid on">
            <input name="paid_on" type="date" defaultValue={item?.paidOn ?? ''} className={fieldClass} />
          </Label>
        )}
        <Label text="Reference">
          <input name="reference" defaultValue={item?.reference ?? ''} placeholder="Leave blank to assign one" className={fieldClass} />
        </Label>
      </div>
      <FormFoot error={error} hint="A blank reference is assigned when you save. Marking it paid records today’s date if you leave the paid date empty.">
        <button disabled={pending || services.length === 0} className="h-12 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90 disabled:opacity-60">{pending ? 'Saving…' : item ? 'Save changes' : 'Add installment'}</button>
      </FormFoot>
    </form>
  )
}

function ReceiptBook({
  rows,
  customers,
  pending,
  onError,
  onNotice,
  onDelete,
}: {
  rows: LedgerReceipt[]
  customers: PaymentLedgerData['customers']
  pending: boolean
  onError: (value: string) => void
  onNotice: (value: string) => void
  onDelete: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [editing, setEditing] = useState<LedgerReceipt | 'new' | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const visible = useMemo(() => rows.filter((item) => {
    const haystack = `${item.customerName} ${item.email} ${item.phone} ${item.reference} ${item.method}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase()) && (status === 'all' || item.status === status)
  }), [rows, query, status])

  return (
    <>
      <PanelHead
        detail="Payments taken on the site, and any receipt you record by hand."
        action="Record receipt"
        onAction={() => { setEditing('new'); setConfirming(null); onError(''); onNotice('') }}
      />
      {editing && (
        <ReceiptForm
          item={editing === 'new' ? null : editing}
          customers={customers}
          onClose={() => setEditing(null)}
          onSaved={() => {
            onNotice(editing === 'new' ? 'Receipt recorded.' : 'Receipt saved.')
            onError('')
            setEditing(null)
          }}
        />
      )}
      <Toolbar
        query={query}
        onQuery={setQuery}
        label="Search receipts"
        status={status}
        onStatus={setStatus}
        statuses={receiptStatuses.map((item) => ({ value: item, label: installmentLabel(item) }))}
        shown={visible.length}
        total={rows.length}
      />
      {rows.length === 0 ? (
        <Empty title="No receipts yet." detail="Mobile Money payments from the site appear here. You can also record one." />
      ) : visible.length === 0 ? (
        <Empty title="Nothing matches." detail="Try another email, phone, or reference." action="Clear filters" onAction={() => { setQuery(''); setStatus('all') }} />
      ) : (
        <ol>
          {visible.map((item) => (
            <Row key={item.id}>
              <RowBody
                title={item.customerName}
                amount={formatUgx(item.amount)}
                line={`${item.email}${item.phone ? ` · ${formatUgandaPhone(item.phone) || item.phone}` : ''}`}
                meta={`${formatLongDate(item.createdOn)} · ${item.method} · ${item.reference}`}
              />
              <RowTools>
                <StatusBadge tone={item.status === 'paid' ? 'green' : item.status === 'failed' ? 'muted' : 'gold'}>{installmentLabel(item.status)}</StatusBadge>
                <IconButton label="Edit receipt" onClick={() => { setEditing(item); setConfirming(null); onError(''); onNotice('') }}><Pencil size={14} /></IconButton>
                {item.status !== 'paid' && (
                  <DeleteControl
                    confirming={confirming === item.id}
                    pending={pending}
                    ask="Delete this receipt?"
                    onAsk={() => setConfirming(item.id)}
                    onCancel={() => setConfirming(null)}
                    onConfirm={() => onDelete(item.id)}
                  />
                )}
              </RowTools>
            </Row>
          ))}
        </ol>
      )}
    </>
  )
}

function ReceiptForm({
  item,
  customers,
  onClose,
  onSaved,
}: {
  item: LedgerReceipt | null
  customers: PaymentLedgerData['customers']
  onClose: () => void
  onSaved: () => void
}) {
  const [customerId, setCustomerId] = useState(item?.customerId ?? '')
  const [email, setEmail] = useState(item?.email ?? '')
  const [phone, setPhone] = useState(item?.phone ?? '')
  const [method, setMethod] = useState(item?.method || 'Mobile Money')
  const [status, setStatus] = useState(item?.status ?? 'paid')
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const { pending, track } = useAdminProgress()
  const methodChoices = method && !methods.includes(method) ? [method, ...methods] : methods

  useEffect(() => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  return (
    <form
      ref={formRef}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        void track((report) => finishSave(report, () => saveMobilePayment(formData))).then((result) => {
          if (result.error) setError(result.error)
          else onSaved()
        })
      }}
      className="border-b border-brand-line bg-brand-surface"
    >
      <FormTitle title={item ? 'Edit receipt' : 'Record receipt'} onClose={onClose} />
      <div className="grid gap-5 px-5 pb-6 sm:grid-cols-2 sm:px-6">
        <input type="hidden" name="id" value={item?.id ?? ''} />
        <Label text="Customer" className="sm:col-span-2">
          <select
            name="customer_id"
            value={customerId}
            onChange={(event) => {
              const next = event.target.value
              setCustomerId(next)
              const customer = customers.find((entry) => entry.id === next)
              if (customer) {
                setEmail(customer.email)
                setPhone(customer.phone)
              }
            }}
            className={fieldClass}
          >
            <option value="">No linked customer</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
        </Label>
        <Label text="Email">
          <input name="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} />
        </Label>
        <Label text="Phone">
          <input name="phone" type="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldClass} />
        </Label>
        <Label text="Amount (UGX)">
          <input name="amount" inputMode="numeric" required defaultValue={item ? String(item.amount) : ''} placeholder="500000" className={fieldClass} />
        </Label>
        <Label text="Method">
          <select name="method" value={method} onChange={(event) => setMethod(event.target.value)} className={fieldClass}>
            {methodChoices.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
          </select>
        </Label>
        <Label text="Status">
          <select name="status" value={status} onChange={(event) => setStatus(event.target.value as LedgerReceipt['status'])} className={fieldClass}>
            {receiptStatuses.map((entry) => <option key={entry} value={entry}>{installmentLabel(entry)}</option>)}
          </select>
        </Label>
        <Label text="Reference">
          <input name="reference" defaultValue={item?.reference ?? ''} placeholder="Leave blank to assign one" className={fieldClass} />
        </Label>
      </div>
      <FormFoot error={error} hint="Choosing a customer fills their email and phone. The receipt then shows on that account.">
        <button disabled={pending} className="h-12 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90 disabled:opacity-60">{pending ? 'Saving…' : item ? 'Save changes' : 'Record receipt'}</button>
      </FormFoot>
    </form>
  )
}

function PanelHead({ detail, action, onAction, disabled = false }: { detail: string; action: string; onAction: () => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-4 border-b border-brand-line p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <p className="max-w-xl text-sm leading-6 text-brand-muted">{detail}</p>
      <button type="button" disabled={disabled} onClick={onAction} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90 disabled:opacity-50">
        <Plus size={15} /> {action}
      </button>
    </div>
  )
}

function Toolbar({
  query,
  onQuery,
  label,
  status,
  onStatus,
  statuses,
  shown,
  total,
}: {
  query: string
  onQuery: (value: string) => void
  label: string
  status: string
  onStatus: (value: string) => void
  statuses: { value: string; label: string }[]
  shown: number
  total: number
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-brand-line px-5 py-4 sm:flex-row sm:items-center sm:px-6">
      <label className="flex h-12 flex-1 items-center gap-2 border border-brand-line bg-white px-3 text-brand-muted md:h-11">
        <Search size={16} />
        <span className="sr-only">{label}</span>
        <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search name, phone, or reference" aria-label={label} className="w-full bg-transparent text-base text-brand-ink outline-none placeholder:text-brand-muted md:text-sm" />
      </label>
      <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
        <span className="sr-only">Status</span>
        <select value={status} onChange={(event) => onStatus(event.target.value)} aria-label="Filter by status" className={`${fieldClass} sm:w-44`}>
          <option value="all">All statuses</option>
          {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <p className="text-xs text-brand-muted sm:ml-auto">{shown} of {total}</p>
    </div>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <li className="flex flex-col gap-4 border-b border-brand-line px-5 py-5 last:border-b-0 sm:px-6 lg:flex-row lg:items-center lg:justify-between">{children}</li>
}

function RowBody({ title, amount, line, meta, note = '' }: { title: string; amount: string; line: string; meta: string; note?: string }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-serif text-xl leading-tight sm:text-2xl">{title}</p>
        <p className="text-sm font-semibold tabular-nums">{amount}</p>
      </div>
      <p className="mt-1 truncate text-sm text-brand-muted">{line}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-muted">{meta}</p>
      {note && <p className="mt-2 text-sm leading-5 text-brand-ink">{note}</p>}
    </div>
  )
}

function RowTools({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">{children}</div>
}

function DeleteControl({
  confirming,
  pending,
  ask,
  onAsk,
  onCancel,
  onConfirm,
}: {
  confirming: boolean
  pending: boolean
  ask: string
  onAsk: () => void
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!confirming) {
    return <IconButton label={ask} onClick={onAsk}><Trash2 size={14} /></IconButton>
  }
  return (
    <span className="flex items-center gap-2">
      <span className="text-xs text-brand-muted">{ask}</span>
      <button type="button" disabled={pending} onClick={onConfirm} className="h-10 bg-red-800 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">Delete</button>
      <button type="button" onClick={onCancel} className="h-10 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">Keep</button>
    </span>
  )
}

function FormTitle({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-5 sm:px-6">
      <h3 className="font-serif text-2xl">{title}</h3>
      <button type="button" onClick={onClose} className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted hover:text-brand-ink">Cancel</button>
    </div>
  )
}

function FormFoot({ error, hint, children }: { error: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-brand-line px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className={`text-xs leading-5 ${error ? 'text-red-700' : 'text-brand-muted'}`} role="status">{error || hint}</p>
      <div className="flex gap-2">{children}</div>
    </div>
  )
}

function Label({ text, className = '', children }: { text: string; className?: string; children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted ${className}`}>
      {text}
      {children}
    </label>
  )
}

function Empty({ title, detail, action, onAction }: { title: string; detail: string; action?: string; onAction?: () => void }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-serif text-2xl">{title}</p>
      <p className="mt-2 text-sm text-brand-muted">{detail}</p>
      {action && onAction && (
        <button type="button" onClick={onAction} className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-gold-deep">{action}</button>
      )}
    </div>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="flex size-11 items-center justify-center border border-brand-line text-brand-ink hover:border-brand-ink md:size-10">
      {children}
    </button>
  )
}
