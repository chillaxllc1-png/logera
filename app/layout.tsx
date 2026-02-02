import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { baseMetadata } from '@/lib/metadata'

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