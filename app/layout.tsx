import type { Metadata } from 'next'
import './globals.css'
import ConditionalLayout from '@/components/ConditionalLayout'
import FaceModelLoader from '@/components/FaceModelLoader'


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Jaayvee Staff Portal",
              "url": "https://staff.jaayvee.com",
              "logo": "https://staff.jaayvee.com/static/logos/staff/staff_logo.png",
              "description": "Internal staff portal for Jaayvee operations. Handle KYC, payouts, campaign checks, and internal validation tasks with our comprehensive staff dashboard.",
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
              "serviceType": "Internal Staff Portal",
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
      </body>
    </html>
  )
}
