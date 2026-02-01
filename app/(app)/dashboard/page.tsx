'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import RequireSubscription from '@/components/RequireSubscription'

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
    const { hasActiveSubscription, isLoading, user } = useAuth()

    const [showWelcome, setShowWelcome] = useState(false)
    const [showActivated, setShowActivated] = useState(false)

    /**
     * ✅ 重要：ローカルストレージキーは「ユーザー単位」
     * - 別ユーザーでログインした時に混ざるのを防ぐ
     */
    const uid = user?.id ?? 'guest'
    const welcomeKey = `datlynq:welcomeShown:${uid}`
    const activatedKey = `datlynq:subscriptionActivated:${uid}`

    // =========================
    // 初回 Welcome 表示（課金済みになった時だけ1回）
    // =========================
    useEffect(() => {
        if (hasActiveSubscription !== true) return

        const alreadyShown = localStorage.getItem(welcomeKey)
        if (!alreadyShown) {
            setShowWelcome(true)
            localStorage.setItem(welcomeKey, 'true')
        }
    }, [hasActiveSubscription, welcomeKey])

    // =========================
    // 課金完了バナー（1回だけ）
    // - hasActiveSubscription が true になったタイミングで一度だけ出す
    // =========================
    useEffect(() => {
        if (hasActiveSubscription !== true) return

        const fromCheckout = sessionStorage.getItem('datlynq:fromCheckout')
        if (!fromCheckout) return

        setShowActivated(true)

        // 1回きりにする（ここが肝）
        sessionStorage.removeItem('datlynq:fromCheckout')
    }, [hasActiveSubscription])

    // =========================
    // 描画ガード（真っ白禁止）
    // =========================
    // 認証中 or DB未同期(null) の時は「読み込み中」を出す（null返しは禁止）
    if (isLoading || hasActiveSubscription === null) {
        return (
            <section
                style={{
                    maxWidth: 980,
                    margin: '0 auto',
                    padding: '56px 20px 80px',
                    lineHeight: 1.7,
                    color: '#6b7280',
                    fontSize: 14,
                }}
            >
                読み込み中…
            </section>
        )
    }

    return (
        <section
            style={{
                maxWidth: 980,
                margin: '0 auto',
                padding: '56px 20px 80px',
                lineHeight: 1.7,
            }}
        >
            <h1 style={{ margin: '0 0 12px', fontSize: 28 }}>管理画面</h1>

            {/* ✅ 課金完了（1回だけ） */}
            {showActivated && (
                <div
                    style={{
                        margin: '0 0 16px',
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: '#ecfdf5',
                        border: '1px solid #6ee7b7',
                        color: '#065f46',
                        fontWeight: 800,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 6,
                        }}
                    >
                        <PartyPopperIcon />
                        <span>お支払いが完了しました！</span>
                    </div>
                    <div>DatLynq のすべての機能をご利用いただけます。</div>
                </div>
            )}

            {/* 🎉 初回Welcome（課金済のみ・1回だけ） */}
            {!showActivated && showWelcome && hasActiveSubscription === true && (
                <p
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        margin: '0 0 24px',
                        color: '#065f46',
                        fontWeight: 700,
                        background: '#ecfdf5',
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: '1px solid #6ee7b7',
                    }}
                >
                    ご契約ありがとうございます。DatLynq の全機能をご利用いただけます。
                </p>
            )}

            <p style={{ margin: '0 0 20px', color: '#374151' }}>
                DatLynq の管理画面です。ここからデータの確認や、契約内容の管理を行います。
            </p>

            {/* =========================
                未課金ユーザー向けメイン CTA（★1つだけ）
            ========================= */}
            {hasActiveSubscription === false && (
                <div
                    style={{
                        margin: '0 0 32px',
                        padding: 20,
                        borderRadius: 16,
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                    }}
                >
                    <p
                        style={{
                            margin: '0 0 12px',
                            fontWeight: 800,
                            color: '#92400e',
                        }}
                    >
                        Starter プラン以上でご利用いただけます
                    </p>

                    <Link
                        href="/billing"
                        style={{
                            display: 'inline-block',
                            padding: '10px 16px',
                            borderRadius: 999,
                            background: '#111827',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: 14,
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            wordBreak: 'keep-all',
                        }}
                    >
                        プランを確認する
                    </Link>
                </div>
            )}

            {/* =========================
                機能カード
            ========================= */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 16,
                }}
            >
                {/* 有料機能① */}
                <RequireSubscription>
                    <div style={card}>
                        <h2 style={cardTitle}>注文・返金履歴</h2>
                        <p style={cardBody}>
                            注文や返金対応の履歴を、顧客単位・時系列で確認できます。
                        </p>

                        <button style={primaryButton}>利用する</button>
                    </div>
                </RequireSubscription>

                {/* 有料機能② */}
                <RequireSubscription>
                    <div style={card}>
                        <h2 style={cardTitle}>傾向の確認</h2>
                        <p style={cardBody}>
                            過去データと比較した傾向を、参考情報として確認できます。
                        </p>

                        <button style={primaryButton}>利用する</button>
                    </div>
                </RequireSubscription>

                {/* 無料機能 */}
                <div style={card}>
                    <h2 style={cardTitle}>請求・契約</h2>
                    <p style={cardBody}>
                        現在のプラン内容、請求状況の確認、プラン変更や解約手続きを行えます。
                    </p>

                    <Link href="/billing" style={primaryLink}>
                        請求・契約を開く
                    </Link>
                </div>
            </div>

            <p style={{ marginTop: 32, fontSize: 13, color: '#6b7280' }}>
                ※ 本管理画面は初期表示イメージです。機能は順次実装予定です。
            </p>
        </section>
    )
}

/* =========================
   styles
========================= */

const card: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 20,
    background: '#ffffff',
}

const cardTitle: React.CSSProperties = {
    margin: '0 0 8px',
    fontSize: 18,
}

const cardBody: React.CSSProperties = {
    margin: '0 0 14px',
    color: '#374151',
}

const primaryLink: React.CSSProperties = {
    display: 'inline-block',
    padding: '10px 14px',
    borderRadius: 10,
    background: '#111827',
    color: '#ffffff',
    fontWeight: 700,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    wordBreak: 'keep-all',
}

const primaryButton: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: 10,
    border: 'none',
    background: '#111827',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
}