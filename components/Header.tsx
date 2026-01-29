'use client'

/**
 * Header は認証状態によって表示を切り替える
 * - 未ログイン：販売導線（料金 / ログイン / 新規登録）
 * - ログイン後：管理・契約導線 + 課金状態の明示 +（未課金なら軽い注意）
 *
 * ※ 実際の認証実装後に useAuth / logout 処理を差し替える
 */

import Link from 'next/link'
import { useAuth } from '@/lib/useAuth'

export default function Header() {
    const {
        isLoggedIn,
        hasActiveSubscription,
        subscriptionPlan,
        logout,
    } = useAuth()

    return (
        <header
            style={{
                borderBottom: '1px solid #e5e7eb',
                background: '#ffffff',
            }}
        >
            <div
                style={{
                    maxWidth: 1100,
                    margin: '0 auto',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                }}
            >
                {/* ロゴ */}
                <Link
                    href={isLoggedIn ? '/dashboard' : '/'}
                    style={{
                        textDecoration: 'none',
                        color: '#111827',
                        fontWeight: 800,
                        fontSize: 18,
                        letterSpacing: 0.2,
                    }}
                >
                    Logera
                </Link>

                {/* ナビゲーション */}
                {isLoggedIn ? (
                    <LoggedInNav
                        hasActiveSubscription={hasActiveSubscription}
                        subscriptionPlan={subscriptionPlan}
                        onLogout={logout}
                    />
                ) : (
                    <GuestNav />
                )}
            </div>
        </header>
    )
}

/* =========================
   未ログイン時
========================= */

function GuestNav() {
    return (
        <nav style={nav}>
            <Link href="/pricing" style={navLink}>
                料金
            </Link>

            <Link href="/login" style={navLink}>
                ログイン
            </Link>

            <Link href="/signup" style={ctaButton}>
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
    const planLabel = subscriptionPlan ?? 'Starter'

    return (
        <nav style={nav}>
            {/* ① 課金済：最優先で「プラン利用中」 */}
            {hasActiveSubscription ? (
                <Link href="/billing" style={planBadge}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {planLabel} プラン利用中
                </Link>
            ) : (
                /* ③ 未課金：軽い注意（Header補完・最小） */
                <span style={unpaidNote}>
                    ※ 未課金です（一部機能が制限されます）
                </span>
            )}

            <Link href="/dashboard" style={navLink}>
                管理画面
            </Link>

            <Link href="/billing" style={navLink}>
                請求・契約
            </Link>

            {/* ログアウト：デモ用に一時的に有効化 */}
            <button
                type="button"
                onClick={onLogout}
                style={logoutButton}
                aria-label="ログアウト"
            >
                ログアウト
            </button>
        </nav>
    )
}

/* =========================
   styles
========================= */

const nav: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
}

const navLink: React.CSSProperties = {
    textDecoration: 'none',
    color: '#374151',
    fontWeight: 600,
}

const ctaButton: React.CSSProperties = {
    textDecoration: 'none',
    padding: '8px 14px',
    borderRadius: 10,
    background: '#111827',
    color: '#ffffff',
    fontWeight: 700,
    whiteSpace: 'nowrap',
}

/* ① 課金状態バッジ（強化・クリック可） */
const planBadge: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 999,
    background: '#ecfeff',
    border: '1px solid #67e8f9',
    color: '#155e75',
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    cursor: 'pointer',
}

/* ③ 未課金の軽い注意（Header補完・最小） */
const unpaidNote: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 999,
    background: '#fffbeb',
    border: '1px solid #fde68a',
    color: '#92400e',
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
}

/* ログアウト（デモ用に有効化） */
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