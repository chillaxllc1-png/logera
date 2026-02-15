import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { baseMetadata } from '@/lib/metadata'
import Script from 'next/script'

export const metadata = baseMetadata

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          background: '#f9fafb',
          color: '#111827',
        }}
      >
        {/* 🔥 ここが重要 */}
        <Script
          src="https://js.pay.jp/v2/pay.js"
          strategy="beforeInteractive"
        />

        <AuthProvider>
          <Header />
          <main
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              padding: '0 20px',
            }}
          >
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}