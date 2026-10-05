import { createPublicKey, verify } from 'node:crypto'

const certsUrl = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
const skewSeconds = 5 * 60

type CertCache = { keys: Record<string, string>; expiresAt: number }
let certCache: CertCache | null = null

export type FirebaseIdentity = {
  uid: string
  email?: string
  phone_number?: string
  name?: string
  picture?: string
}

function decodePart(part: string) {
  const padded = part.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  return Buffer.from(padded + pad)
}

async function signingCerts(force: boolean) {
  const now = Date.now()
  if (!force && certCache && certCache.expiresAt > now) return certCache.keys
  const response = await fetch(certsUrl)
  if (!response.ok) throw new Error('Google signing keys could not be loaded.')
  const maxAge = Number(/max-age=(\d+)/.exec(response.headers.get('cache-control') ?? '')?.[1] ?? 3600)
  const keys = await response.json() as Record<string, string>
  certCache = { keys, expiresAt: now + Math.max(60, maxAge) * 1000 }
  return keys
}

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseIdentity> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!projectId) throw new Error('Firebase project is not configured.')

  const parts = idToken.split('.')
  if (parts.length !== 3) throw new Error('Invalid token')
  const header = JSON.parse(decodePart(parts[0]).toString('utf8')) as { alg?: string; kid?: string }
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Invalid token')

  let pem = (await signingCerts(false))[header.kid]
  if (!pem) pem = (await signingCerts(true))[header.kid]
  if (!pem) throw new Error('Invalid token')

  const signatureOk = verify(
    'RSA-SHA256',
    Buffer.from(`${parts[0]}.${parts[1]}`),
    createPublicKey(pem),
    decodePart(parts[2]),
  )
  if (!signatureOk) throw new Error('Invalid token')

  const payload = JSON.parse(decodePart(parts[1]).toString('utf8')) as Record<string, unknown>
  const now = Math.floor(Date.now() / 1000)
  const issuer = `https://securetoken.google.com/${projectId}`
  if (payload.aud !== projectId || payload.iss !== issuer) throw new Error('Invalid token')
  if (typeof payload.exp !== 'number' || payload.exp < now - skewSeconds) throw new Error('Invalid token')
  if (typeof payload.iat !== 'number' || payload.iat > now + skewSeconds) throw new Error('Invalid token')
  if (typeof payload.auth_time !== 'number' || payload.auth_time > now + skewSeconds) throw new Error('Invalid token')
  if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('Invalid token')

  return {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    phone_number: typeof payload.phone_number === 'string' ? payload.phone_number : undefined,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
  }
}
