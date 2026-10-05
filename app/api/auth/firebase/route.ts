import { openFirebaseSession } from '@/lib/auth/firebase-session'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let idToken = ''
  try {
    const body = await request.json() as { idToken?: unknown }
    if (typeof body.idToken === 'string') idToken = body.idToken
  } catch {
    return Response.json({ error: 'Sign-in could not be completed.' }, { status: 400 })
  }

  if (!idToken || idToken.length > 8000) {
    return Response.json({ error: 'Sign-in could not be completed.' }, { status: 400 })
  }

  try {
    const result = await openFirebaseSession(idToken)
    if (result.error) return Response.json({ error: result.error }, { status: 400 })
    return Response.json({ role: result.role })
  } catch (error) {
    console.error('firebase session', error instanceof Error ? error.message : error)
    return Response.json({ error: 'Firebase could not confirm this sign-in.' }, { status: 401 })
  }
}
