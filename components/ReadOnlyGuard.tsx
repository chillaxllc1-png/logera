'use client'

import React from 'react'
import Link from 'next/link'
import ButtonLink from '@/components/ui/ButtonLink.tsx'

type ReadOnlyGuardProps = {
    children: React.ReactNode

    /** 読み取り専用かどうか */
    isReadOnly: boolean

    /** 表示理由（省略可） */
    reason?: string
}

/**
 * 読み取り専用モードガード（共通）
 * - 操作UIを無効化
 * - 視認は可能
 * - 課金 / 対応導線を表示
 */
export default function ReadOnlyGuard({
    children,
    isReadOnly,
    reason,
}: ReadOnlyGuardProps) {
    if (!isReadOnly) {
        return <>{children}</>
    }

    return (
        <div
            style={{
                position: 'relative',
                borderRadius: 16,
                overflow: 'hidden',
            }}
        >
            {/* 元UI（視認のみ） */}
            <div
                aria-hidden="true"
                style={{
                    pointerEvents: 'none',
                    filter: 'blur(1.2px)',
                    opacity: 0.55,
                }}
            >
                {children}
            </div>

            {/* オーバーレイ */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 251, 235, 0.92)',
                    border: '1px solid #fde68a',
                    borderRadius: 16,
                    padding: 20,
                    textAlign: 'center',
                }}
            >
                <div>
                    <p
                        style={{
                            margin: '0 0 8px',
                            fontWeight: 800,
                            color: '#92400e',
                        }}
                    >
                        現在この画面は読み取り専用です
                    </p>

                    {reason && (
                        <p
                            style={{
                                margin: '0 0 14px',
                                fontSize: 14,
                                color: '#92400e',
                            }}
                        >
                            {reason}
                        </p>
                    )}

                    <ButtonLink href="/billing">
                        請求・契約を確認する
                    </ButtonLink>
                </div>
            </div>
        </div>
    )
}