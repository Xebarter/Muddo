import { applyMobileMoneyUpdate, verifyMobileMoneySignature } from '@/lib/mobile-money'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-signature') ?? ''
  if (!signature || !(await verifyMobileMoneySignature(body, signature))) {
    return Response.json({ error: 'The callback could not be verified.' }, { status: 401 })
  }

  let purchase: { id?: string; status?: string; reference?: string }
  try {
    purchase = JSON.parse(body) as { id?: string; status?: string; reference?: string }
  } catch {
    return Response.json({ error: 'The callback could not be read.' }, { status: 400 })
  }

  await applyMobileMoneyUpdate(purchase)
  return Response.json({ received: true })
}
