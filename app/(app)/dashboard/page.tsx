'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import RequireSubscription from '@/components/RequireSubscription'
import { FEATURE_LIST } from '@/lib/features'
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import ButtonLink from '@/components/ui/ButtonLink'

function PartyPopperIcon() {
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
            <path d="M5.8 11.3 2 22l10.7-3.79" />
            <path d="M4 3h.01" />
            <path d="M22 8h.01" />
            <path d="M15 2h.01" />
            <path d="M22 20h.01" />
            <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
            <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" />
            <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" />
            <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" />
        </svg>
    )
}

export default function Dashboard() {
    const {
        hasActiveSubscription,
        subscriptionStatus,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        isLoading,
        user,
    } = useAuth()

    // ✅ 読み取り専用判定（past_due / expired）
    // 説明UI用（操作制御は ReadOnlyGuard に委譲）
    const isReadOnly =
        subscriptionStatus === 'past_due' ||
        subscriptionStatus === 'expired'

    const readOnlyReason =
        subscriptionStatus === 'past_due'
            ? 'お支払いが確認できていません'
            : subscriptionStatus === 'expired'
                ? 'サブスクリプションの有効期限が切れています'
                : undefined

    const [showWelcome, setShowWelcome] = useState(false)
    const [showActivated, setShowActivated] = useState(false)

    const uid = user?.id ?? 'guest'
    const welcomeKey = `datlynq:welcomeShown:${uid}`

    useEffect(() => {
        if (hasActiveSubscription !== true) return
        if (!localStorage.getItem(welcomeKey)) {
            setShowWelcome(true)
            localStorage.setItem(welcomeKey, 'true')
        }
    }, [hasActiveSubscription, welcomeKey])

    useEffect(() => {
        if (hasActiveSubscription !== true) return
        if (sessionStorage.getItem('datlynq:fromCheckout')) {
            setShowActivated(true)
            sessionStorage.removeItem('datlynq:fromCheckout')
        }
    }, [hasActiveSubscription])

    if (isLoading || hasActiveSubscription === null) {
        return <section style={{ padding: 40 }}>読み込み中…</section>
    }

    return (
        <section
            style={{ maxWidth: 980, margin: '0 auto', padding: '56px 20px' }}
        >
            <h1 style={{ fontSize: 28 }}>管理画面</h1>

            {/* =========================
                読み取り専用モード バナー
            ========================= */}
            {isReadOnly && (
                <div
                    style={{
                        margin: '16px 0',
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        color: '#92400e',
                        fontWeight: 700,
                        fontSize: 14,
                    }}
                >
                    現在このアカウントは
                    <strong> 読み取り専用モード </strong>
                    です。
                    <br />
                    操作を再開するには
                    <Link
                        href="/billing"
                        style={{
                            marginLeft: 4,
                            textDecoration: 'underline',
                        }}
                    >
                        請求・契約を確認してください
                    </Link>
                </div>
            )}

            {/* 解約予約中 */}
            {hasActiveSubscription === true &&
                cancelAtPeriodEnd &&
                currentPeriodEnd && (
                    <div style={warningBanner}>
                        解約予約中：
                        {new Date(currentPeriodEnd).toLocaleDateString('ja-JP')}
                        までご利用いただけます
                    </div>
                )}

            {showActivated && (
                <div style={{ margin: '16px 0', color: '#065f46' }}>
                    <PartyPopperIcon /> お支払いが完了しました！
                </div>
            )}

            {showWelcome && (
                <p style={{ marginBottom: 20 }}>
                    ご契約ありがとうございます。DatLynq の機能をご利用いただけます。
                </p>
            )}

            {/* =========================
                機能カード
            ========================= */}
            <div style={grid}>
                {FEATURE_LIST.map((feature) => (
                    <RequireSubscription
                        key={feature.key}
                        featureKey={feature.key}
                    >
                        <ReadOnlyGuard
                            isReadOnly={isReadOnly}
                            reason={readOnlyReason}
                        >
                            <div style={card}>
                                <h2>{feature.name}</h2>
                                <p>{feature.description}</p>

                                <ButtonLink onClick={() => { }}>
                                    利用する
                                </ButtonLink>
                            </div>
                        </ReadOnlyGuard>
                    </RequireSubscription>
                ))}

                {/* 無料カード */}
                <div style={card}>
                    <h2>請求・契約</h2>
                    <p>プラン確認・変更・解約はこちら。</p>
                    <ButtonLink href="/billing">
                        請求・契約を確認する
                    </ButtonLink>
                </div>
            </div>
        </section>
    )
}

/* =========================
   styles
========================= */

const grid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 16,
}

const card: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 20,
}

const primaryButton: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: 10,
    border: 'none',
    background: '#111827',
    color: '#fff',
    fontWeight: 700,
}

const warningBanner: React.CSSProperties = {
    margin: '16px 0',
    padding: '12px 16px',
    borderRadius: 12,
    background: '#fffbeb',
    border: '1px solid #fde68a',
    color: '#92400e',
    fontWeight: 700,
    fontSize: 14,
}