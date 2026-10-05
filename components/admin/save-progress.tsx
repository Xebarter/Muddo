'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type Report = (value: number) => void

const AdminProgressContext = createContext<{
  pending: boolean
  track: <T>(work: (report: Report) => Promise<T>) => Promise<T>
} | null>(null)

export function AdminProgressProvider({ children }: { children: ReactNode }) {
  const [percent, setPercent] = useState<number | null>(null)

  const track = useCallback(async <T,>(work: (report: Report) => Promise<T>) => {
    setPercent(0)
    try {
      const result = await work((value) => setPercent(Math.max(0, Math.min(100, Math.round(value)))))
      const failed = typeof result === 'object' && result !== null && 'error' in result && Boolean((result as { error?: string }).error)
      if (!failed) {
        setPercent(100)
        await new Promise((resolve) => window.setTimeout(resolve, 450))
      }
      return result
    } finally {
      setPercent(null)
    }
  }, [])

  return (
    <AdminProgressContext.Provider value={{ pending: percent !== null, track }}>
      {children}
      <SaveProgress value={percent} />
    </AdminProgressContext.Provider>
  )
}

export function useAdminProgress() {
  const context = useContext(AdminProgressContext)
  if (!context) throw new Error('Admin progress is only available in the admin dashboard.')
  return context
}

export function finishSave<T>(report: Report, task: () => Promise<T>, start = 0) {
  let current = start
  let live = true
  const step = () => {
    if (!live) return
    current = Math.min(92, current + Math.max(0.6, (92 - current) * 0.05))
    report(current)
    window.requestAnimationFrame(step)
  }
  window.requestAnimationFrame(step)
  return task().finally(() => {
    live = false
  })
}

export function uploadAdminImage(file: File, report: Report) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith('image/') || file.size > 5_000_000) {
      reject(new Error('Choose an image under 5 MB.'))
      return
    }
    const body = new FormData()
    body.set('image', file)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/media')
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) report((event.loaded / event.total) * 80)
    }
    xhr.onload = () => {
      let payload: { url?: string; error?: string } = {}
      try {
        payload = JSON.parse(xhr.responseText) as { url?: string; error?: string }
      } catch {
        payload = {}
      }
      if (xhr.status >= 200 && xhr.status < 300 && payload.url) resolve(payload.url)
      else reject(new Error(payload.error || 'The image could not be uploaded.'))
    }
    xhr.onerror = () => reject(new Error('The image could not be uploaded.'))
    xhr.send(body)
  })
}

export async function saveAdminForm(
  report: Report,
  formData: FormData,
  action: (formData: FormData) => Promise<{ error?: string; id?: string }>,
) {
  const file = formData.get('image')
  let start = 0
  if (file instanceof File && file.size > 0) {
    try {
      const url = await uploadAdminImage(file, report)
      formData.set('image_path', url)
      formData.delete('image')
      start = 85
      report(start)
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'The image could not be uploaded.' }
    }
  }
  return finishSave(report, () => action(formData), start)
}

function SaveProgress({ value }: { value: number | null }) {
  if (value === null) return null
  const percent = Math.max(0, Math.min(100, Math.round(value)))
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101c17]/50" role="status" aria-live="polite" aria-label={`Saving, ${percent} percent`}>
      <div className="relative flex size-36 items-center justify-center bg-white shadow-[0_16px_40px_rgba(16,28,23,0.28)]">
        <svg viewBox="0 0 100 100" className="size-28 -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#dce9df" strokeWidth="7" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#28704d"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-150"
          />
        </svg>
        <span className="absolute text-lg font-semibold tabular-nums text-[#28704d]">{percent}%</span>
      </div>
    </div>
  )
}
