import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pothole Map Dashboard',
  description: 'Interactive dashboard for tracking and managing pothole reports',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
