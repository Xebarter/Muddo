export function saveReceipt(reference: string, token?: string) {
  const params = token ? `?token=${encodeURIComponent(token)}` : ''
  const link = document.createElement('a')
  link.href = `/api/receipts/${encodeURIComponent(reference)}${params}`
  link.download = `Mudogwaluyiira-${reference}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export function receiptHref(reference: string) {
  return `/api/receipts/${encodeURIComponent(reference)}`
}
