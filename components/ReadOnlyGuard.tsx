'use client'

import { ReactNode } from 'react'

type ReadOnlyGuardProps = {
  isReadOnly: boolean
  children: ReactNode
}

export default function ReadOnlyGuard({
  isReadOnly,
  children,
}: ReadOnlyGuardProps) {
  if (!isReadOnly) {
    return <>{children}</>
  }

  return (
    <div
      aria-disabled="true"
      style={{
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  )
}