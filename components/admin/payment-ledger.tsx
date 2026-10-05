'use client'

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { finishSave, useAdminProgress } from '@/components/admin/save-progress'
import { StatusBadge } from '@/components/site/design-system'
import { deleteInstallment, deleteMobilePayment, saveInstallment, saveMobilePayment } from '@/lib/actions'
import { formatLongDate, formatUgx, installmentLabel, installmentStatuses, receiptStatuses } from '@/lib/format'
import type { LedgerInstallment, LedgerReceipt, PaymentLedgerData } from '@/lib/data'

const methods = ['Mobile Money', 'Bank transfer', 'Cash', 'Cheque']

const fieldClass = 'h-11 border border-brand-line bg-white px-3 text-sm font-medium normal-case tracking-normal text-brand-ink outline-none focus:border-brand-ink'

export function PaymentDesk({ ledger }: { ledger: PaymentLedgerData | null }) {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
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

  const openPlans = ledger.installments.filter((item) => item.status !== 'paid').length
  const openReceipts = ledger.receipts.filter((item) => item.status === 'pending').length

  return (
    <div className="mt-8 space-y-10">
      <section className="grid overflow-hidden border border-brand-ink bg-brand-ink text-white sm:grid-cols-3">
        <Figure label="Collected" value={formatUgx(ledger.collected)} note="Installments and receipts marked paid" />
        <Figure label="Outstanding" value={formatUgx(ledger.outstanding)} note="Still to collect" rule />
        <Figure label="Open" value={String(openPlans + openReceipts).padStart(2, '0')} note={`${openPlans} installments · ${openReceipts} receipts`} rule />
      </section>

      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      {notice && !error && <p className="text-sm text-brand-muted" role="status">{notice}</p>}

      <InstallmentBook
        rows={ledger.installments}
        services={ledger.services}
        pending={pending}
        onError={setError}
        onNotice={setNotice}
        onDelete={(id) => run(() => deleteInstallment(id), 'Installment deleted.')}
      />
      <ReceiptBook
        rows={ledger.receipts}
        customers={ledger.customers}
        pending={pending}
        onError={setError}
        onNotice={setNotice}
        onDelete={(id) => run(() => deleteMobilePayment(id), 'Receipt deleted.')}
      />
    </div>
  )
}

function Figure({ label, value, note, rule = false }: { label: string; value: string; note: string; rule?: boolean }) {
  return (
    <div className={`px-6 py-7 ${rule ? 'sm:border-l sm:border-white/10' : ''}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold-light">{label}</p>
      <p className="mt-3 font-serif text-3xl tracking-[-0.04em] tabular-nums">{value}</p>
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
    <section className="border border-brand-line bg-white">
      <div className="flex flex-col gap-5 border-b border-brand-line p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">Plans</p>
          <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em]">Installments</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-brand-muted">Amounts a customer owes on a service. Paid rows appear on their account statement.</p>
        </div>
        <button type="button" onClick={() => { setEditing('new'); onError(''); onNotice('') }} className="inline-flex h-12 items-center justify-center gap-2 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90">
          <Plus size={15} /> New installment
        </button>
      </div>

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

      <div className="flex flex-col gap-3 border-b border-brand-line px-6 py-4 sm:flex-row sm:items-center">
        <SearchField value={query} onChange={setQuery} label="Search installments" />
        <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
          <span className="sr-only">Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status" className={`${fieldClass} sm:w-40`}>
            <option value="all">All statuses</option>
            {installmentStatuses.map((item) => <option key={item} value={item}>{installmentLabel(item)}</option>)}
          </select>
        </label>
        <p className="text-xs text-brand-muted sm:ml-auto">{visible.length} shown</p>
      </div>

      {rows.length === 0 ? (
        <Empty title="No installments yet." detail="Add the first payment on a customer service." />
      ) : visible.length === 0 ? (
        <Empty title="Nothing matches." detail="Try another name, reference, or status." />
      ) : (
        <ol>
          {visible.map((item) => (
            <li key={item.id} className="grid gap-4 border-b border-brand-line px-6 py-5 last:border-b-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_auto] lg:items-center">
              <div className="min-w-0">
                <p className="font-serif text-2xl leading-tight">{item.name}</p>
                <p className="mt-1 truncate text-sm text-brand-muted">{item.customerName} · {item.serviceLabel}</p>
              </div>
              <div>
                <p className="text-sm font-semibold tabular-nums">{formatUgx(item.amount)}</p>
                <p className="mt-1 text-xs text-brand-muted">Due {formatLongDate(item.dueOn)}{item.paidOn ? ` · Paid ${formatLongDate(item.paidOn)}` : ''}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">{item.reference}{item.method ? ` · ${item.method}` : ''}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <StatusBadge tone={item.status === 'paid' ? 'green' : item.status === 'failed' ? 'muted' : 'gold'}>{installmentLabel(item.status)}</StatusBadge>
                <IconButton label="Edit installment" onClick={() => { setEditing(item); setConfirming(null); onError(''); onNotice('') }}><Pencil size={14} /></IconButton>
                {item.status !== 'paid' && confirming === item.id ? (
                  <>
                    <button type="button" disabled={pending} onClick={() => onDelete(item.id)} className="h-10 bg-red-800 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">Delete</button>
                    <button type="button" onClick={() => setConfirming(null)} className="h-10 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">Cancel</button>
                  </>
                ) : item.status !== 'paid' ? (
                  <IconButton label="Delete installment" onClick={() => setConfirming(item.id)}><Trash2 size={14} /></IconButton>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
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
  const { pending, track } = useAdminProgress()
  const methodChoices = method && !methods.includes(method) ? [...methods, method] : methods

  return (
    <form
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
      <div className="flex items-center justify-between px-6 py-5">
        <h3 className="font-serif text-2xl">{item ? 'Edit installment' : 'New installment'}</h3>
        <button type="button" onClick={onClose} className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted hover:text-brand-ink">Cancel</button>
      </div>
      <div className="grid gap-5 px-6 pb-6 sm:grid-cols-2">
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
      <div className="flex flex-col gap-3 border-t border-brand-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs ${error ? 'text-red-700' : 'text-brand-muted'}`} role="status">{error || 'A blank reference is assigned when you save. Marking it paid records today’s date if you leave the paid date empty.'}</p>
        <button disabled={pending || services.length === 0} className="h-12 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90 disabled:opacity-60">{pending ? 'Saving…' : item ? 'Save changes' : 'Add installment'}</button>
      </div>
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
    <section className="border border-brand-line bg-white">
      <div className="flex flex-col gap-5 border-b border-brand-line p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">Receipts</p>
          <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em]">Mobile Money</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-brand-muted">Payments taken on the site, and any receipt you record by hand.</p>
        </div>
        <button type="button" onClick={() => { setEditing('new'); onError(''); onNotice('') }} className="inline-flex h-12 items-center justify-center gap-2 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90">
          <Plus size={15} /> Record receipt
        </button>
      </div>

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

      <div className="flex flex-col gap-3 border-b border-brand-line px-6 py-4 sm:flex-row sm:items-center">
        <SearchField value={query} onChange={setQuery} label="Search receipts" />
        <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
          <span className="sr-only">Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter receipts by status" className={`${fieldClass} sm:w-40`}>
            <option value="all">All statuses</option>
            {receiptStatuses.map((item) => <option key={item} value={item}>{installmentLabel(item)}</option>)}
          </select>
        </label>
        <p className="text-xs text-brand-muted sm:ml-auto">{visible.length} shown</p>
      </div>

      {rows.length === 0 ? (
        <Empty title="No receipts yet." detail="Mobile Money payments from the site appear here. You can also record one." />
      ) : visible.length === 0 ? (
        <Empty title="Nothing matches." detail="Try another email, phone, or reference." />
      ) : (
        <ol>
          {visible.map((item) => (
            <li key={item.id} className="grid gap-4 border-b border-brand-line px-6 py-5 last:border-b-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_auto] lg:items-center">
              <div className="min-w-0">
                <p className="font-serif text-2xl leading-tight">{item.customerName}</p>
                <p className="mt-1 truncate text-sm text-brand-muted">{item.email}{item.phone ? ` · ${item.phone}` : ''}</p>
              </div>
              <div>
                <p className="text-sm font-semibold tabular-nums">{formatUgx(item.amount)}</p>
                <p className="mt-1 text-xs text-brand-muted">{formatLongDate(item.createdOn)} · {item.method}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">{item.reference}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <StatusBadge tone={item.status === 'paid' ? 'green' : item.status === 'failed' ? 'muted' : 'gold'}>{installmentLabel(item.status)}</StatusBadge>
                <IconButton label="Edit receipt" onClick={() => { setEditing(item); setConfirming(null); onError(''); onNotice('') }}><Pencil size={14} /></IconButton>
                {item.status !== 'paid' && confirming === item.id ? (
                  <>
                    <button type="button" disabled={pending} onClick={() => onDelete(item.id)} className="h-10 bg-red-800 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">Delete</button>
                    <button type="button" onClick={() => setConfirming(null)} className="h-10 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">Cancel</button>
                  </>
                ) : item.status !== 'paid' ? (
                  <IconButton label="Delete receipt" onClick={() => setConfirming(item.id)}><Trash2 size={14} /></IconButton>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
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
  const { pending, track } = useAdminProgress()
  const methodChoices = method && !methods.includes(method) ? [method, ...methods] : methods

  return (
    <form
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
      <div className="flex items-center justify-between px-6 py-5">
        <h3 className="font-serif text-2xl">{item ? 'Edit receipt' : 'Record receipt'}</h3>
        <button type="button" onClick={onClose} className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted hover:text-brand-ink">Cancel</button>
      </div>
      <div className="grid gap-5 px-6 pb-6 sm:grid-cols-2">
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
      <div className="flex flex-col gap-3 border-t border-brand-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs ${error ? 'text-red-700' : 'text-brand-muted'}`} role="status">{error || 'Choosing a customer fills their email and phone. The receipt then shows on that account.'}</p>
        <button disabled={pending} className="h-12 bg-brand-ink px-5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-brand-ink/90 disabled:opacity-60">{pending ? 'Saving…' : item ? 'Save changes' : 'Record receipt'}</button>
      </div>
    </form>
  )
}

function SearchField({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return (
    <label className="flex h-11 flex-1 items-center gap-2 border border-brand-line bg-white px-3 text-brand-muted">
      <Search size={16} />
      <span className="sr-only">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search" aria-label={label} className="w-full bg-transparent text-sm text-brand-ink outline-none placeholder:text-brand-muted" />
    </label>
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

function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-serif text-2xl">{title}</p>
      <p className="mt-2 text-sm text-brand-muted">{detail}</p>
    </div>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="flex size-10 items-center justify-center border border-brand-line text-brand-ink hover:border-brand-ink">
      {children}
    </button>
  )
}
