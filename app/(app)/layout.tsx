'use client'

import { ReactNode, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'

/**
 * AppLayout
 *
 * 役割：
 * - 管理画面のログインガードのみ
 *
 * 重要：
 * - isLoading が終わるまで「何も判断しない」
 */
export default function AppLayout({
    children,
}: {
    children: ReactNode
}) {
    const router = useRouter()
    const { isLoggedIn, isLoading } = useAuth()

    useEffect(() => {
        // 🔑 初期同期が終わるまで触らない
        if (isLoading) return

        if (!isLoggedIn) {
            router.replace('/login')
        }
    }, [isLoading, isLoggedIn, router])

    // 🔑 初期同期中はローディング表示
    if (isLoading) {
        return (
            <div
                style={{
                    minHeight: '60vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b7280',
                    fontSize: 14,
                }}
            >
                読み込み中…
            </div>
        )
    }

    // 未ログイン（リダイレクト待ち）
    if (!isLoggedIn) {
        return null
    }

    // ログイン済み
    return <>{children}</>
}