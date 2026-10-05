'use client'

import { useState, type FormEvent } from 'react'
import { submitJobApplication } from '@/lib/actions'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function JobApplicationForm({ jobId }: { jobId: string }) {
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const name = String(data.get('full_name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const phone = String(data.get('phone') ?? '').trim()
    const cover = String(data.get('cover_letter') ?? '').trim()
    const file = data.get('cv')

    if (name.length < 2) {
      setError('Enter your name.')
      return
    }
    if (!emailPattern.test(email)) {
      setError('Enter a valid email.')
      return
    }
    if (phone.replace(/\D/g, '').length < 9) {
      setError('Enter a phone number.')
      return
    }
    if (cover.length < 20) {
      setError('Write a short cover letter.')
      return
    }
    if (!(file instanceof File) || file.size === 0) {
      setError('Attach your CV.')
      return
    }

    setPending(true)
    setError('')
    const result = await submitJobApplication(data)
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
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b48b45]">Application received</p>
        <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em]">Thank you. We have your application.</h2>
        <p className="mt-3 text-sm leading-6 text-[#65736d]">The hiring team will read it and contact you if your experience matches the role.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-4 border border-[#d9ddd8] bg-white p-6 md:p-8" noValidate>
      <input type="hidden" name="job_id" value={jobId} />
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
          <input name="phone" type="tel" autoComplete="tel" required className="field mt-2" placeholder="+256 700 000 000" />
        </label>
      </div>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#65736d]">Cover letter</span>
        <textarea name="cover_letter" required rows={6} className="field mt-2 resize-y" placeholder="Why this role, and what you would bring to it." />
      </label>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#65736d]">CV</span>
        <input name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required className="mt-2 block w-full text-sm file:mr-3 file:border-0 file:bg-transparent file:text-[10px] file:font-bold file:uppercase file:tracking-[0.12em]" />
        <span className="mt-2 block text-xs text-[#65736d]">PDF or Word, under 5 MB.</span>
      </label>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <button disabled={pending} className="mt-2 inline-flex h-12 w-full items-center justify-center bg-[#15251f] px-6 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#263f35] disabled:opacity-60 sm:w-fit">
        {pending ? 'Sending…' : 'Submit application'}
      </button>
    </form>
  )
}
