import { buildReceiptPdf } from '@/lib/receipt-pdf'
import { loadPaidReceipt } from '@/lib/receipts'
import { getSiteContact } from '@/lib/data'

export const runtime = 'nodejs'

export async function GET(request: Request, context: { params: Promise<{ reference: string }> }) {
  const { reference } = await context.params
  const token = new URL(request.url).searchParams.get('token') ?? ''
  const receipt = await loadPaidReceipt(decodeURIComponent(reference), token)
  if (!receipt) return new Response('Receipt not found.', { status: 404 })

  const contact = await getSiteContact()
  const pdf = await buildReceiptPdf(receipt, {
    email: contact.email,
    phone: contact.phoneDisplay,
    address: contact.address,
  })

  const filename = `Mudogwaluyiira-${receipt.reference}.pdf`
  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
