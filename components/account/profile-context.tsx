'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { saveProfileAction } from '@/lib/actions'

export type Profile = {
  name: string
  email: string
  phone: string
  location: string
}

const ProfileContext = createContext<{
  profile: Profile
  role: string
  saveProfile: (next: Profile) => Promise<{ error?: string }>
}>({
  profile: { name: '', email: '', phone: '', location: '' },
  role: 'Customer',
  saveProfile: async () => ({}),
})

export function ProfileProvider({
  children,
  initial,
  role,
}: {
  children: ReactNode
  initial: Profile
  role: string
}) {
  const [profile, setProfile] = useState<Profile>(initial)

  const saveProfile = async (next: Profile) => {
    const result = await saveProfileAction(next)
    if (result.error) return result
    setProfile(next)
    return {}
  }

  return <ProfileContext.Provider value={{ profile, role, saveProfile }}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  return useContext(ProfileContext)
}
