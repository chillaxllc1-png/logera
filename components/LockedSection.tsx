'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import LockedOverlay from '@/components/LockedOverlay'

type Props = {
  /** ロックするか */
  locked: boolean
  /** LockedOverlay の variant（既存の upgrade/readonly を使う） */
  variant?: 'upgrade' | 'readonly'
  /** ロック中に押したら飛ばす先（デフォは /billing） */
  href?: string
  /** 中身 */
  children: React.ReactNode
  /** 見た目微調整 */
  blurPx?: number
  opacity?: number
}

export default function LockedSection({
  locked,
  variant = 'upgrade',
  href = '/billing',
  children,
  blurPx = 2,
  opacity = 0.55,
}: Props) {
  const router = useRouter()

  return (
    <div style={{ position: 'relative' }}>
      {locked && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
          }}
          onClick={() => router.push(href)}
        >
          <LockedOverlay variant={variant} />
        </div>
      )}

      {/* 中身は常に描画する。locked のときだけ薄くする */}
      <div
        style={{
          filter: locked ? `blur(${blurPx}px)` : undefined,
          opacity: locked ? opacity : 1,
          pointerEvents: locked ? 'none' : 'auto',
          userSelect: locked ? 'none' : 'auto',
        }}
        aria-hidden={locked ? true : undefined}
      >
        {children}
      </div>
    </div>
  )
}