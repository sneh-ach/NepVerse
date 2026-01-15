import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://nepverse.com'),
  title: {
    default: 'NepVerse - The Home of Nepali Stories',
    template: '%s | NepVerse',
  },
  description: 'Unlimited Nepali Movies, Originals & Web Series. Stream premium Nepali content anytime, anywhere. Watch the best Nepali entertainment on demand.',
  keywords: ['Nepali movies', 'Nepali series', 'OTT platform', 'Nepal streaming', 'Nepali content', 'Nepali entertainment', 'Nepali cinema', 'streaming service'],
  authors: [{ name: 'NepVerse' }],
  creator: 'NepVerse',
  publisher: 'NepVerse',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://nepverse.com',
    siteName: 'NepVerse',
    title: 'NepVerse - The Home of Nepali Stories',
    description: 'Unlimited Nepali Movies, Originals & Web Series. Stream premium Nepali content anytime, anywhere.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NepVerse - The Home of Nepali Stories',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NepVerse - The Home of Nepali Stories',
    description: 'Unlimited Nepali Movies, Originals & Web Series. Stream premium Nepali content anytime, anywhere.',
    images: ['/og-image.jpg'],
    creator: '@nepverse',
    site: '@nepverse',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  return (
    <html lang="en" data-theme="dark">
      <head>
        {gaId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}');
                `,
              }}
            />
          </>
        )}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#e50914" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NepVerse" />
        <meta name="application-name" content="NepVerse" />
        <meta name="msapplication-TileColor" content="#e50914" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
      </head>
      <body className={`${inter.variable} font-sans bg-background text-foreground antialiased`}>
        <ErrorBoundary>
          <Header />
          <main className="min-h-screen pt-16">
            {children}
          </main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                padding: '18px 24px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                backdropFilter: 'blur(20px) saturate(180%)',
                fontSize: '15px',
                fontWeight: '500',
                letterSpacing: '0.01em',
                lineHeight: '1.5',
              },
              success: {
                style: {
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                  boxShadow: '0 20px 60px rgba(16, 185, 129, 0.2), 0 0 0 1px rgba(16, 185, 129, 0.2) inset, 0 0 30px rgba(16, 185, 129, 0.1)',
                },
                className: 'toast-success',
              },
              error: {
                style: {
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
                  boxShadow: '0 20px 60px rgba(239, 68, 68, 0.2), 0 0 0 1px rgba(239, 68, 68, 0.2) inset, 0 0 30px rgba(239, 68, 68, 0.1)',
                },
                className: 'toast-error',
              },
            }}
          />
        </ErrorBoundary>
      </body>
    </html>
  )
}

