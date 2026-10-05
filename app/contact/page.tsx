import type { Metadata } from 'next'
import { ContactForm } from '@/components/site/contact-form'
import { PublicSite } from '@/components/site/public-site'
import { getSiteContact } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Contact | Mudogwaluyiira Group of Companies',
  description: 'Write to Mudogwaluyiira Group of Companies. Call, send a message, or reach us on WhatsApp.',
}

export default async function ContactPage() {
  const contact = await getSiteContact()

  return (
    <PublicSite>
      <section className="bg-[#15251f] px-5 pb-16 pt-36 text-white lg:px-8 lg:pb-24 lg:pt-44">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow text-[#d9bb7d]">Contact</p>
          <h1 className="section-title max-w-3xl text-white">Tell us what<br /><span className="text-[#d9bb7d]">you need.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/70">Whether you are building, learning, planning an event, or looking for a partner, send a message and we will reply.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[0.75fr_1.25fr] lg:px-8 lg:py-24">
        <div>
          <p className="eyebrow">Reach us</p>
          <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em]">{contact.address}</h2>
          <dl className="mt-8 grid gap-6 text-sm">
            {contact.hours && (
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#65736d]">Hours</dt>
                <dd className="mt-2 text-base font-semibold">{contact.hours}</dd>
              </div>
            )}
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#65736d]">Phone</dt>
              <dd className="mt-2"><a href={contact.phoneTel} className="text-base font-semibold underline decoration-[#d9ddd8] underline-offset-4 hover:decoration-[#15251f]">{contact.phoneDisplay}</a></dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#65736d]">Email</dt>
              <dd className="mt-2"><a href={`mailto:${contact.email}`} className="text-base font-semibold underline decoration-[#d9ddd8] underline-offset-4 hover:decoration-[#15251f]">{contact.email}</a></dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#65736d]">WhatsApp</dt>
              <dd className="mt-2"><a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" className="text-base font-semibold underline decoration-[#d9ddd8] underline-offset-4 hover:decoration-[#15251f]">Chat on WhatsApp</a></dd>
            </div>
          </dl>
        </div>
        <ContactForm />
      </section>
    </PublicSite>
  )
}
