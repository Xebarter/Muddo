'use client'

import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/actions'

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter()

  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        const [{ getFirebaseAuth }, { signOut: firebaseSignOut }] = await Promise.all([
          import('@/lib/firebase/client'),
          import('firebase/auth'),
        ])
        await firebaseSignOut(getFirebaseAuth()).catch(() => {})
        await signOut()
        router.push('/login')
        router.refresh()
      }}
    >
      Sign out
    </button>
  )
}
