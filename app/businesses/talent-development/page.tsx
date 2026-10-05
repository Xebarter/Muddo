import type { Metadata } from 'next'
import { BusinessPage } from '@/components/site/business-page'
import { getBusiness } from '@/lib/businesses'

const business = getBusiness('talent-development')

export const metadata: Metadata = {
  title: `${business.title} | Mudogwaluyiira Group of Companies`,
  description: business.summary,
}

export default function TalentDevelopmentPage() {
  return <BusinessPage slug="talent-development" />
}
