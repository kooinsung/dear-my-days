import type { Metadata, Viewport } from 'next'
import { QueryProvider } from '@/libs/providers/query-provider'
import '@/common/styles/global.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Dear Days',
  description: '소중한 날들을 기억하세요',
  ...viewport,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
