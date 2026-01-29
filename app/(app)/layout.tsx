'use client'

import { ReactNode, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'

export default function AppLayout({ children }: { children: ReactNode }) {
    const router = useRouter()
    const { isLoggedIn, hasActiveSubscription, isLoading } = useAuth()

    useEffect(() => {
        if (isLoading) return

        // 未ログイン → ログインへ
        if (!isLoggedIn) {
            router.replace('/login')
            return
        }

        // 未課金 → billing へ
        if (!hasActiveSubscription) {
            router.replace('/billing')
            return
        }
    }, [isLoading, isLoggedIn, hasActiveSubscription, router])

    /* =========================
       表示制御
    ========================= */

    // ローディング中（セッション判定中など）
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

    // ガード未通過（遷移待ち）
    if (!isLoggedIn || !hasActiveSubscription) {
        return null
    }

    // 課金済・ログイン済のみ描画
    return <>{children}</>
}