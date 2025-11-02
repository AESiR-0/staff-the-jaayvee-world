import type { Metadata } from 'next'
import './globals.css'
import ConditionalLayout from '@/components/ConditionalLayout'
import FaceModelLoader from '@/components/FaceModelLoader'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://team.thejaayveeworld.com'),
  title: {
    default: "Jaayvee Team Portal",
    template: "%s | Jaayvee Team"
  },
  description: "Internal team portal for Jaayvee operations. Handle KYC, payouts, campaign checks, and internal validation tasks with our comprehensive team dashboard.",
  icons: {
    icon: "/static/logos/staff/staff_icon_192.png",
    shortcut: "/static/logos/staff/staff_icon_192.png",
    apple: "/static/logos/staff/staff_icon_192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jaayvee Staff",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1e3a8a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/static/logos/staff/staff_icon_192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Jaayvee Staff" />
        <meta name="theme-color" content="#1e3a8a" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Jaayvee team Portal",
              "url": "https://team.thejaayveeworld.com",
              "logo": "https://team.thejaayveeworld.com/static/logos/team/team_logo.png",
              "description": "Internal team portal for Jaayvee operations. Handle KYC, payouts, campaign checks, and internal validation tasks with our comprehensive team dashboard.",
              "foundingDate": "2024",
              "founders": [
                {
                  "@type": "Person",
                  "name": "Jaayvee Team"
                }
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+91-XXXXXXXXXX",
                "contactType": "customer service",
                "availableLanguage": ["English", "Hindi"]
              },
              "sameAs": [
                "https://twitter.com/jaayvee",
                "https://linkedin.com/company/jaayvee",
                "https://instagram.com/jaayvee"
              ],
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "IN",
                "addressRegion": "Maharashtra",
                "addressLocality": "Mumbai"
              },
              "serviceType": "Internal Team Portal",
              "areaServed": {
                "@type": "Country",
                "name": "India"
              }
            })
          }}
        />
      </head>
      <body>
        <FaceModelLoader />
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
        <PWAInstallPrompt />
      </body>
    </html>
  )
}
