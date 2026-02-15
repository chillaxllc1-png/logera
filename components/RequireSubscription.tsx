'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'

type RequireSubscriptionProps = {
    children: ReactNode
}

/**
 * RequireSubscription
 *
 * 役割：
 * - 未契約ユーザーのみを checkout に誘導する
 * - プラン差分・ロック表示は一切扱わない
 */
export default function RequireSubscription({
    children,
}: RequireSubscriptionProps) {
    const { hasActiveSubscription, isLoading } = useAuth()

    // 認証・DB同期中は描画しない（チラ見防止）
    if (isLoading || hasActiveSubscription === null) {
        return null
    }

    // 完全未契約のみ checkout に誘導
    if (hasActiveSubscription === false) {
        return (
            <Link href="/checkout" style={{ textDecoration: 'none' }}>
                {children}
            </Link>
        )
    }

    // 契約あり → そのまま表示
    return <>{children}</>
}