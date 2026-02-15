'use client'

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import SettingsContent from './SettingsContent'

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  )
}