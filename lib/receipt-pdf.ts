import { readFile } from 'fs/promises'
import path from 'path'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { PaidReceipt } from '@/lib/receipts'

type CompanyLines = {
  email: string
  phone: string
  address: string
}

const ink = rgb(21 / 255, 37 / 255, 31 / 255)
const gold = rgb(201 / 255, 164 / 255, 92 / 255)
const goldDeep = rgb(180 / 255, 139 / 255, 69 / 255)
const muted = rgb(101 / 255, 115 / 255, 109 / 255)
const green = rgb(40 / 255, 112 / 255, 77 / 255)
const paper = rgb(244 / 255, 241 / 255, 234 / 255)
const white = rgb(1, 1, 1)
const hairline = rgb(217 / 255, 221 / 255, 216 / 255)

export async function buildReceiptPdf(receipt: PaidReceipt, company: CompanyLines) {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595.28, 841.89])
  const serif = await pdf.embedFont(StandardFonts.TimesRoman)
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold)
  const sans = await pdf.embedFont(StandardFonts.Helvetica)
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const { width, height } = page.getSize()

  page.drawRectangle({ x: 0, y: 0, width, height, color: paper })
  const sheetX = 36
  const sheetW = width - 72
  const sheetBottom = 32
  const sheetTop = height - 32
  page.drawRectangle({ x: sheetX, y: sheetBottom, width: sheetW, height: sheetTop - sheetBottom, color: white })
  page.drawRectangle({ x: sheetX, y: sheetTop - 7, width: sheetW, height: 7, color: gold })

  const logoBytes = await readFile(path.join(process.cwd(), 'public', 'web-app-manifest-512x512.png'))
  const logo = await pdf.embedPng(logoBytes)
  const logoSize = 92
  const logoY = sheetTop - 36 - logoSize
  page.drawImage(logo, { x: (width - logoSize) / 2, y: logoY, width: logoSize, height: logoSize })

  let cursor = logoY - 28
  drawTracked(page, 'MUDOGWALUYIIRA', { font: serifBold, size: 16, y: cursor, color: ink, tracking: 1.6, width })
  cursor -= 16
  drawTracked(page, 'GROUP OF COMPANIES', { font: sans, size: 8, y: cursor, color: muted, tracking: 1.8, width })
  cursor -= 18
  page.drawRectangle({ x: (width - 72) / 2, y: cursor, width: 72, height: 1.5, color: gold })
  cursor -= 28
  drawTracked(page, 'OFFICIAL RECEIPT', { font: sansBold, size: 9, y: cursor, color: goldDeep, tracking: 2.4, width })
  cursor -= 46

  const amount = plain(`UGX ${new Intl.NumberFormat('en-UG').format(receipt.amount)}`)
  let amountSize = 32
  while (amountSize > 18 && serif.widthOfTextAtSize(amount, amountSize) > width - 140) amountSize -= 2
  drawCentered(page, amount, serif, amountSize, cursor, ink, width)
  cursor -= 24
  drawTracked(page, 'PAID', { font: sansBold, size: 9, y: cursor, color: green, tracking: 2.2, width })
  cursor -= 36

  const rows = [
    ['Receipt no.', receipt.reference],
    ['Date', receiptDate(receipt.paidOn)],
    ['Received from', receipt.payerName],
    ['Email', receipt.email],
    ['Phone', receipt.phone],
    ['Description', receipt.description],
    ['Method', receipt.method],
  ]
  if (receipt.service) rows.push(['Service', receipt.service])

  const rowX = sheetX + 48
  const rowW = sheetW - 96
  for (const [label, value] of rows) {
    if (!value) continue
    page.drawRectangle({ x: rowX, y: cursor - 8, width: rowW, height: 0.6, color: hairline })
    page.drawText(plain(label), { x: rowX, y: cursor + 8, size: 9, font: sans, color: muted })
    const valueSize = 11
    const valueText = plain(value)
    const valueWidth = sansBold.widthOfTextAtSize(valueText, valueSize)
    const maxValue = rowW * 0.62
    page.drawText(valueWidth > maxValue ? fit(valueText, sansBold, valueSize, maxValue) : valueText, {
      x: rowX + rowW - Math.min(valueWidth, maxValue),
      y: cursor + 8,
      size: valueSize,
      font: sansBold,
      color: ink,
    })
    cursor -= 32
  }

  cursor -= 18
  const thanks = 'This confirms a payment received by Mudogwaluyiira Group of Companies. Keep this receipt for your records.'
  for (const line of wrap(thanks, serif, 11, rowW)) {
    drawCentered(page, line, serif, 11, cursor, muted, width)
    cursor -= 16
  }

  const footerH = 78
  page.drawRectangle({ x: sheetX, y: sheetBottom, width: sheetW, height: footerH, color: ink })
  page.drawRectangle({ x: sheetX, y: sheetBottom + footerH, width: sheetW, height: 3, color: gold })
  const footer = [company.address, company.phone, company.email].filter(Boolean).join('   ·   ')
  drawCentered(page, footer, sans, 9, sheetBottom + 44, rgb(1, 1, 1), width)
  drawTracked(page, 'THANK YOU', { font: sansBold, size: 8, y: sheetBottom + 24, color: gold, tracking: 2.2, width })

  pdf.setTitle(`Receipt ${receipt.reference}`)
  pdf.setAuthor('Mudogwaluyiira Group of Companies')
  return pdf.save()
}

function receiptDate(value: string) {
  const date = value ? new Date(value.includes('T') ? value : `${value}T12:00:00+03:00`) : new Date()
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Kampala' }).format(date)
}

function drawCentered(page: PDFPage, text: string, font: PDFFont, size: number, y: number, color: ReturnType<typeof rgb>, pageWidth: number) {
  const safe = plain(text)
  const textWidth = font.widthOfTextAtSize(safe, size)
  page.drawText(safe, { x: (pageWidth - textWidth) / 2, y, size, font, color })
}

function drawTracked(page: PDFPage, text: string, options: { font: PDFFont; size: number; y: number; color: ReturnType<typeof rgb>; tracking: number; width: number }) {
  const chars = [...plain(text)]
  const widths = chars.map((char) => options.font.widthOfTextAtSize(char, options.size))
  const total = widths.reduce((sum, item) => sum + item, 0) + options.tracking * Math.max(0, chars.length - 1)
  let x = (options.width - total) / 2
  chars.forEach((char, index) => {
    page.drawText(char, { x, y: options.y, size: options.size, font: options.font, color: options.color })
    x += widths[index] + options.tracking
  })
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const words = plain(text).split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

function fit(text: string, font: PDFFont, size: number, width: number) {
  let value = text
  while (value.length > 1 && font.widthOfTextAtSize(`${value}…`, size) > width) value = value.slice(0, -1)
  return `${value}…`
}

function plain(value: string) {
  return value.normalize('NFKD').replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, ' ').trim()
}
