'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'

function LockIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <circle cx="12" cy="16" r="1" />
            <rect x="3" y="10" width="18" height="12" rx="2" />
            <path d="M7 10V7a5 5 0 0 1 10 0v3" />
        </svg>
    )
}

export default function RequireSubscription({
    children,
    featureKey,
}: {
    children: ReactNode
    featureKey: string
}) {
    const { hasActiveSubscription, isLoading, canUseFeature } = useAuth()

    // 認証・DB同期中は描画しない（チラ見防止）
    if (isLoading || hasActiveSubscription === null) {
        return null
    }

    // ✅ 機能が使える → そのまま表示
    if (canUseFeature(featureKey)) {
        return <>{children}</>
    }

    // ❌ 機能が使えない → ロック表示
    return (
        <div
            style={{
                position: 'relative',
                borderRadius: 16,
                overflow: 'hidden',
            }}
        >
            {/* 元のカード（視認はできるが操作不可） */}
            <div
                aria-hidden="true"
                tabIndex={-1}
                aria-disabled="true"
                style={{
                    pointerEvents: 'none',
                    filter: 'blur(1.2px)',
                    opacity: 0.55,
                }}
            >
                {children}
            </div>

            {/* ロックオーバーレイ */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 251, 235, 0.94)',
                    border: '1px solid #fde68a',
                    borderRadius: 16,
                    padding: 20,
                    textAlign: 'center',
                }}
            >
                <div>
                    <p
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            margin: '0 0 8px',
                            fontWeight: 800,
                            color: '#92400e',
                        }}
                    >
                        <LockIcon />
                        有料プラン限定機能
                    </p>

                    <p
                        style={{
                            margin: '0 0 14px',
                            fontSize: 14,
                            color: '#92400e',
                        }}
                    >
                        Starter プラン以上でご利用いただけます
                    </p>

                    <Link
                        href="/billing"
                        style={{
                            display: 'inline-block',
                            padding: '8px 18px',
                            borderRadius: 999,
                            background: '#111827',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: 14,
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            wordBreak: 'keep-all',
                        }}
                    >
                        プランを確認する
                    </Link>
                </div>
            </div>
        </div>
    )
}