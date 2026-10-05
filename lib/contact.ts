import { ugandaMobile } from '@/lib/payments/phone'

export const companyPhoneDisplay = '+256 787 703 725'
export const companyPhoneTel = 'tel:+256787703725'
export const companyWhatsApp = 'https://wa.me/256787703725'
export const companyEmail = 'muddogwaluyiiragroup@gmail.com'
export const companyEmailMailto = `mailto:${companyEmail}`
export const companyAddress = 'Kampala, Uganda'

export type SiteContact = {
  email: string
  phoneDisplay: string
  phoneTel: string
  whatsapp: string
  address: string
  hours: string
}

export const fallbackSiteContact: SiteContact = {
  email: companyEmail,
  phoneDisplay: companyPhoneDisplay,
  phoneTel: companyPhoneTel,
  whatsapp: companyWhatsApp,
  address: companyAddress,
  hours: '',
}

export function formatUgandaPhone(input: string) {
  const international = ugandaMobile(input)
  if (!international) return ''
  const local = international.slice(3)
  return `+256 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
}

export function siteContactFrom(input: {
  publicEmail: string
  phone: string
  whatsapp: string
  address: string
  hours: string
}): SiteContact {
  const phone = formatUgandaPhone(input.phone) || companyPhoneDisplay
  const whatsapp = formatUgandaPhone(input.whatsapp) || phone
  const phoneDigits = ugandaMobile(phone) || '256787703725'
  const whatsappDigits = ugandaMobile(whatsapp) || phoneDigits
  return {
    email: input.publicEmail.trim() || companyEmail,
    phoneDisplay: phone,
    phoneTel: `tel:+${phoneDigits}`,
    whatsapp: `https://wa.me/${whatsappDigits}`,
    address: input.address.trim() || companyAddress,
    hours: input.hours.trim(),
  }
}
