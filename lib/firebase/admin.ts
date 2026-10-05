import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

function serviceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('Firebase admin is not configured')
  const parsed = JSON.parse(raw) as { project_id: string; client_email: string; private_key: string }
  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key.replace(/\\n/g, '\n'),
  }
}

export function getAdminAuth() {
  if (!getApps().length) initializeApp({ credential: cert(serviceAccount()) })
  return getAuth()
}
