import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const siteName = 'Mudogwaluyiira Group of Companies'
const title = 'Mudogwaluyiira Group of Companies | Building Businesses. Developing People.'
const description =
  'A proudly Ugandan group of companies creating opportunities across construction, education, financial services, talent development and events management.'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://muddogroup.com'),
  title,
  description,
  applicationName: 'Mudogwaluyiira',
  generator: 'v0.app',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Mudogwaluyiira',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title,
    description,
    siteName,
    type: 'website',
    locale: 'en_UG',
    images: [
      {
        url: '/mudogwaluyiira-hero.png',
        width: 1376,
        height: 768,
        alt: 'Mudogwaluyiira Group team reviewing construction plans on site',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/mudogwaluyiira-hero.png'],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#15251f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
