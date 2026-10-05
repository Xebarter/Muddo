import { applyMobileMoneyUpdate, verifyMobileMoneySignature } from '@/lib/mobile-money'
import { applyPayoutUpdate } from '@/lib/paytota-payout'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-signature') ?? ''
  if (!signature || !(await verifyMobileMoneySignature(body, signature))) {
    return Response.json({ error: 'The callback could not be verified.' }, { status: 401 })
  }

  let payload: { id?: string; type?: string; status?: string; reference?: string; event_type?: string }
  try {
    payload = JSON.parse(body) as { id?: string; type?: string; status?: string; reference?: string; event_type?: string }
  } catch {
    return Response.json({ error: 'The callback could not be read.' }, { status: 400 })
  }

  if (payload.type === 'payout' || payload.event_type?.startsWith('payout.')) await applyPayoutUpdate(payload)
  else await applyMobileMoneyUpdate(payload)
  return Response.json({ received: true })
}
