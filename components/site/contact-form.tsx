'use client'

import { useState, type FormEvent } from 'react'
import { submitContactMessage } from '@/lib/actions'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ContactForm() {
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const name = String(data.get('full_name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const subject = String(data.get('subject') ?? '').trim()
    const message = String(data.get('message') ?? '').trim()

    if (name.length < 2) {
      setError('Enter your name.')
      return
    }
    if (!emailPattern.test(email)) {
      setError('Enter a valid email.')
      return
    }
    if (subject.length < 2) {
      setError('Enter a subject.')
      return
    }
    if (message.length < 10) {
      setError('Write a message of at least a few words.')
      return
    }

    setPending(true)
    setError('')
    const result = await submitContactMessage(data)
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    form.reset()
    setSent(true)
  }

  if (sent) {
    return (
      <div className="border border-[#d9ddd8] bg-white px-6 py-10" role="status">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b48b45]">Message received</p>
        <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em]">Thank you. We have your message.</h2>
        <p className="mt-3 text-sm leading-6 text-[#65736d]">Someone from Mudogwaluyiira will reply using the email you gave us.</p>
        <button type="button" onClick={() => setSent(false)} className="mt-8 inline-flex h-12 items-center justify-center bg-[#15251f] px-6 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#263f35]">
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-4 border border-[#d9ddd8] bg-white p-6 md:p-8" noValidate>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#65736d]">Name</span>
        <input name="full_name" autoComplete="name" required className="field mt-2" placeholder="Your name" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#65736d]">Email</span>
          <input name="email" type="email" autoComplete="email" required className="field mt-2" placeholder="you@email.com" />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#65736d]">Phone</span>
          <input name="phone" type="tel" autoComplete="tel" className="field mt-2" placeholder="+256 700 000 000" />
        </label>
      </div>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#65736d]">Subject</span>
        <input name="subject" required className="field mt-2" placeholder="How can we help?" />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#65736d]">Message</span>
        <textarea name="message" required rows={6} className="field mt-2" placeholder="Tell us about your project, question, or idea." />
      </label>
      {error && <p className="text-sm text-[#8a3b2b]" role="alert">{error}</p>}
      <button type="submit" disabled={pending} className="inline-flex h-12 items-center justify-center bg-[#c9a45c] text-xs font-bold uppercase tracking-[0.16em] text-[#15251f] hover:bg-[#dbbd7e] disabled:opacity-60">
        {pending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
