'use client'

import { useEffect, useState } from 'react'

export function ProfilePhoto({ src, size = 36 }: { src: string; size?: 36 | 56 }) {
  const [failed, setFailed] = useState(false)
  const box = size === 56 ? 'size-14' : 'size-9'

  useEffect(() => {
    setFailed(false)
  }, [src])

  return (
    <img
      src={src && !failed ? src : '/placeholder-user.jpg'}
      alt=""
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${box} shrink-0 border border-brand-line object-cover`}
    />
  )
}
