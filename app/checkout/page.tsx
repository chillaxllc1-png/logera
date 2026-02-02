// app/checkout/page.tsx
import { Suspense } from 'react'
import CheckoutClient from './CheckoutClient.tsx'

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>読み込み中…</div>}>
      <CheckoutClient />
    </Suspense>
  )
}