export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Suspense } from 'react'
import SettingsContent from './SettingsContent'

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  )
}