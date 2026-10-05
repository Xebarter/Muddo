import type { Metadata } from 'next'
import { BusinessPage } from '@/components/site/business-page'
import { getBusiness } from '@/lib/businesses'

const business = getBusiness('financial-services')

export const metadata: Metadata = {
  title: `${business.title} | Mudogwaluyiira Group of Companies`,
  description: business.summary,
}

export default function FinancialServicesPage() {
  return <BusinessPage slug="financial-services" />
}
