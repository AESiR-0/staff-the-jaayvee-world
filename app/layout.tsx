import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Staff Portal - The Jaayvee World',
  description: 'Staff portal for The Jaayvee World',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
