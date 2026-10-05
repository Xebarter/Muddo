import type { Metadata } from 'next'
import { AccountPageHeader } from '@/components/account/account-page'
import { ProfileForm } from '@/components/account/profile-form'

export const metadata: Metadata = {
  title: 'Profile | Account | Mudogwaluyiira Group',
}

export default function ProfilePage() {
  return (
    <>
      <AccountPageHeader
        eyebrow="Profile"
        title="Your details"
        description="Update the name and contact details used across your Mudogwaluyiira account."
      />
      <ProfileForm />
    </>
  )
}