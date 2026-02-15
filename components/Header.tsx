'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import type { PlanKey } from '@/lib/features'
import { formatPlanLabel } from '@/lib/planLabel'
import SettingsIcon from '@/components/ui/SettingsIcon'
import BellIcon from '@/components/ui/BellIcon'
import { useEffect, useState } from 'react'
import { hasUnreadAlerts } from '@/lib/alerts/hasUnreadAlerts'

export default function Header() {
    const {
        user,
        isLoggedIn,
        hasActiveSubscription,
        subscriptionPlan,
        logout,
        isLoading,
    } = useAuth()

    // （state 定義）
    const [hasUnread, setHasUnread] = useState(false)

    useEffect(() => {
        if (!isLoggedIn || !user?.id) {
            setHasUnread(false)
            return
        }

        let alive = true

        const check = async () => {
            const unread = await hasUnreadAlerts(user.id)
            if (alive) setHasUnread(unread)
        }

        check()

        return () => {
            alive = false
        }
    }, [isLoggedIn, user?.id])

    useEffect(() => {
        if (!user?.id) return

        const onRead = () => {
            setHasUnread(false)
        }

        window.addEventListener('notifications:read', onRead)

        return () => {
            window.removeEventListener('notifications:read', onRead)
        }
    }, [user?.id])

    // 初期同期中は描画しない（チラ見防止）
    if (isLoading || hasActiveSubscription === null) {
        return null
    }

    return (
        <header style={header}>
            <div style={headerInner}>
                {/* 上段 */}
                <div style={topRow}>
                    <Link
                        href={isLoggedIn ? '/dashboard' : '/'}
                        style={logo}
                    >
                        DatLynq
                    </Link>

                    {isLoggedIn && hasActiveSubscription && (
                        <span style={planBadge}>
                            {formatPlanLabel(
                                (subscriptionPlan as PlanKey | null) ?? 'starter'
                            )} プラン利用中
                        </span>
                    )}
                </div>

                {/* 下段 */}
                {isLoggedIn ? (
                    <div style={bottomRow}>
                        <Link href="/dashboard" style={navLink}>
                            管理画面
                        </Link>

                        <Link href="/billing" style={navLink}>
                            請求・契約
                        </Link>

                        {/* 通知 */}
                        <Link
                            href="/notifications"
                            style={{ ...iconButton, position: 'relative' }}
                            aria-label="通知"
                        >
                            <BellIcon size={16} />

                            {hasUnread && (
                                <span
                                    style={{
                                        position: 'absolute',
                                        top: 2,
                                        right: 2,
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: '#dc2626', // 赤
                                        boxShadow: '0 0 0 2px #ffffff', // 背景と分離
                                    }}
                                />
                            )}
                        </Link>

                        {/* 設定（デフォルトタブ） */}
                        <Link
                            href="/settings"
                            style={iconButton}
                            aria-label="設定"
                        >
                            <SettingsIcon size={16} />
                        </Link>

                        <button
                            type="button"
                            onClick={logout}
                            style={logoutButton}
                        >
                            ログアウト
                        </button>
                    </div>
                ) : (
                    <GuestNav />
                )}
            </div>
        </header>
    )
}

/* =========================
   未ログイン
========================= */

function GuestNav() {
    return (
        <nav style={nav}>
            <Link href="/pricing" style={{ ...navLink, ...noWrap }}>
                料金
            </Link>
            <Link href="/login" style={{ ...navLink, ...noWrap }}>
                ログイン
            </Link>
            <Link href="/signup" style={{ ...ctaButton, ...noWrap }}>
                無料で始める
            </Link>
        </nav>
    )
}

/* =========================
   ログイン後
========================= */

function LoggedInNav({
    hasActiveSubscription,
    subscriptionPlan,
    onLogout,
}: {
    hasActiveSubscription: boolean
    subscriptionPlan: string | null
    onLogout: () => void
}) {
    const currentPlan: PlanKey =
        (subscriptionPlan as PlanKey | null) ?? 'starter'

    return (
        <nav style={nav}>
            {/* 課金済 */}
            {hasActiveSubscription === true && (
                <>
                    <Link href="/billing" style={{ ...planBadge, ...noWrap }}>
                        {formatPlanLabel(currentPlan)} プラン利用中
                    </Link>

                    <Link href="/dashboard" style={{ ...navLink, ...noWrap }}>
                        管理画面
                    </Link>
                </>
            )}

            {/* 未課金：CTA は1つだけ */}
            {hasActiveSubscription === false && (
                <Link href="/billing" style={{ ...upgradeButton, ...noWrap }}>
                    プランを確認する
                </Link>
            )}

            <Link href="/billing" style={{ ...navLink, ...noWrap }}>
                請求・契約
            </Link>

            <button
                type="button"
                onClick={onLogout}
                style={{ ...logoutButton, ...noWrap }}
            >
                ログアウト
            </button>
        </nav>
    )
}

/* =========================
   styles
========================= */

const container: React.CSSProperties = {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
}

const logo: React.CSSProperties = {
    textDecoration: 'none',
    color: '#111827',
    fontWeight: 800,
    fontSize: 18,
}

const nav: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',

    // ★ これが重要
    marginLeft: 'auto',   // ← 常に右側へ寄せる
}

const navLink: React.CSSProperties = {
    textDecoration: 'none',
    color: '#374151',
    fontWeight: 600,
    fontSize: 13,
}

const ctaButton: React.CSSProperties = {
    padding: '8px 14px',
    borderRadius: 10,
    background: '#111827',
    color: '#ffffff',
    fontWeight: 700,
    textDecoration: 'none',
    fontSize: 13,
}

const planBadge: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 999,
    background: '#ecfeff',
    border: '1px solid #67e8f9',
    color: '#155e75',
    fontSize: 12,
    fontWeight: 800,
    textDecoration: 'none',
}

const upgradeButton: React.CSSProperties = {
    padding: '8px 14px',
    borderRadius: 999,
    background: '#111827',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: 13,
    textDecoration: 'none',
}

const logoutButton: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 10,
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#374151',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
}

/**
 * ✅ ここが本命
 * 日本語が「プランを確 / 認する」みたいに割れるのを止める
 */
const noWrap: React.CSSProperties = {
    whiteSpace: 'nowrap',
    wordBreak: 'keep-all',
}

const header: React.CSSProperties = {
    borderBottom: '1px solid #e5e7eb',
    background: '#ffffff',
}

const headerInner: React.CSSProperties = {
    maxWidth: 1100,
    margin: '0 auto',
}

const topRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
}

const bottomRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 20px 12px',
    borderTop: '1px solid #f3f4f6',
}

const iconButton: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
    color: '#374151',
    textDecoration: 'none',
}