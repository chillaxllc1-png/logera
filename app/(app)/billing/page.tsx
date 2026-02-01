'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { FEATURES } from '@/lib/features'

export default function Billing() {
    const {
        hasActiveSubscription,
        subscriptionPlan,
        subscriptionStatus,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        isLoading,
    } = useAuth()

    const [showCanceled, setShowCanceled] = useState(false)

    // =========================
    // checkout キャンセル表示（1回だけ）
    // =========================
    useEffect(() => {
        const canceled = sessionStorage.getItem('datlynq:checkoutCanceled')
        if (canceled) {
            setShowCanceled(true)
            sessionStorage.removeItem('datlynq:checkoutCanceled')
        }
    }, [])

    // 読み込み中（真っ白禁止）
    if (isLoading || hasActiveSubscription === null) {
        return <section style={loadingStyle}>読み込み中…</section>
    }

    const currentPlan = subscriptionPlan ?? 'starter'

    const periodEndLabel = currentPeriodEnd
        ? new Date(currentPeriodEnd).toLocaleDateString('ja-JP')
        : null

    return (
        <section style={container}>
            <h1 style={title}>請求・契約</h1>

            {/* =========================
   サブスクリプション状態アラート
========================= */}

            {subscriptionStatus === 'past_due' && (
                <div
                    style={{
                        margin: '16px 0',
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        fontWeight: 700,
                    }}
                >
                    お支払いに失敗しています。
                    <br />
                    お支払い方法を更新してください。
                    <div style={{ marginTop: 8 }}>
                        <Link href="/checkout" style={{ textDecoration: 'underline' }}>
                            お支払いを再開する
                        </Link>
                    </div>
                </div>
            )}

            {subscriptionStatus === 'expired' && (
                <div
                    style={{
                        margin: '16px 0',
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        color: '#92400e',
                        fontWeight: 700,
                    }}
                >
                    サブスクリプションの有効期限が切れています。
                    <br />
                    再契約するとすべての機能が再度利用できます。
                    <div style={{ marginTop: 8 }}>
                        <Link href="/checkout" style={{ textDecoration: 'underline' }}>
                            再契約する
                        </Link>
                    </div>
                </div>
            )}

            {subscriptionStatus === 'canceled' && (
                <div
                    style={{
                        margin: '16px 0',
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        color: '#374151',
                        fontWeight: 700,
                    }}
                >
                    現在サブスクリプションは解約されています。
                    <div style={{ marginTop: 8 }}>
                        <Link href="/checkout" style={{ textDecoration: 'underline' }}>
                            再契約する
                        </Link>
                    </div>
                </div>
            )}

            {showCanceled && (
                <div style={warningBox}>
                    今回のお支払い手続きは完了していません。
                    <br />
                    プランはいつでも後から契約できます。
                </div>
            )}

            <p style={lead}>
                現在のプラン内容、請求状況の確認、
                プラン変更や解約手続きを行えます。
            </p>

            {/* =========================
                現在の契約内容
            ========================= */}
            <div style={card}>
                <h2 style={cardTitle}>現在の契約内容</h2>

                <dl style={dl}>
                    <Row label="契約状態">
                        {subscriptionStatus ?? '—'}
                        {cancelAtPeriodEnd && (
                            <span style={{ color: '#b45309', marginLeft: 8 }}>
                                （解約予約中）
                            </span>
                        )}
                    </Row>

                    <Row label="有効期限">
                        {periodEndLabel ? `${periodEndLabel} まで` : '—'}
                    </Row>

                    <Row label="契約プラン">
                        {hasActiveSubscription ? currentPlan : '未契約'}
                    </Row>

                    <Row label="月額料金">
                        {hasActiveSubscription
                            ? currentPlan === 'pro'
                                ? '49,800円（税込）'
                                : '19,800円（税込）'
                            : '—'}
                    </Row>

                    <Row label="支払方法">
                        {hasActiveSubscription
                            ? 'クレジットカード（pay.jp）'
                            : '—'}
                    </Row>
                </dl>

                {hasActiveSubscription === true &&
                    cancelAtPeriodEnd &&
                    currentPeriodEnd && (
                        <div
                            style={{
                                marginTop: 12,
                                padding: '12px 14px',
                                borderRadius: 12,
                                background: '#fffbeb',
                                border: '1px solid #fde68a',
                                color: '#92400e',
                                fontSize: 14,
                                fontWeight: 700,
                            }}
                        >
                            解約予約中：
                            {new Date(currentPeriodEnd).toLocaleDateString('ja-JP')}
                            までご利用いただけます
                        </div>
                    )}
            </div>

            {/* =========================
                プラン別 機能一覧
            ========================= */}
            <div style={{ ...card, marginTop: 24 }}>
                <h2 style={cardTitle}>プラン別 機能一覧</h2>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {Object.values(FEATURES).map((feature) => {
                        const enabled =
                            hasActiveSubscription &&
                            feature.availablePlans.includes(currentPlan)

                        return (
                            <li
                                key={feature.key}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '10px 0',
                                    borderBottom: '1px solid #f3f4f6',
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600 }}>
                                        {feature.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            color: '#6b7280',
                                        }}
                                    >
                                        {feature.description}
                                    </div>
                                </div>

                                <div
                                    style={{
                                        fontWeight: 800,
                                        color: enabled
                                            ? '#065f46'
                                            : '#92400e',
                                    }}
                                >
                                    {enabled ? '✔ 利用可能' : '🔒 上位プラン'}
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </div>

            {/* =========================
                CTA
            ========================= */}
            {hasActiveSubscription === false && (
                <Link href="/checkout" style={payButton}>
                    Starter プランを契約する
                </Link>
            )}

            {hasActiveSubscription === true &&
                subscriptionPlan === 'starter' && (
                    <Link
                        href="/checkout"
                        style={{
                            ...payButton,
                            background: '#4f46e5',
                            marginTop: 12,
                        }}
                    >
                        Pro プランへアップグレード
                    </Link>
                )}

            {/* =========================
                解約（準備中）
            ========================= */}
            {hasActiveSubscription === true && (
                <div style={{ ...card, marginTop: 24, background: '#fff5f5' }}>
                    <h2 style={cardTitle}>解約について</h2>
                    <p style={{ fontSize: 14, color: '#6b7280' }}>
                        解約はいつでも可能です。
                        解約後も有効期限まではご利用いただけます。
                    </p>
                    <button disabled style={dangerButton}>
                        解約手続き（準備中）
                    </button>
                </div>
            )}

            <div style={{ marginTop: 32 }}>
                <Link href="/dashboard" style={backLink}>
                    管理画面に戻る
                </Link>
            </div>
        </section>
    )
}

/* =========================
   小物
========================= */

function Row({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div style={row}>
            <dt style={dt}>{label}</dt>
            <dd style={dd}>{children}</dd>
        </div>
    )
}

/* =========================
   styles（元のまま）
========================= */

const container = {
    maxWidth: 720,
    margin: '0 auto',
    padding: '56px 20px 80px',
    lineHeight: 1.7,
}

const loadingStyle = {
    maxWidth: 720,
    margin: '0 auto',
    padding: '56px 20px 80px',
    color: '#6b7280',
}

const title = { fontSize: 28, marginBottom: 12 }
const lead = { marginBottom: 28, color: '#374151' }

const card = {
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 20,
    background: '#ffffff',
}

const cardTitle = { marginBottom: 16, fontSize: 20 }
const dl = { margin: 0 }

const row = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
}

const dt = { fontWeight: 600, color: '#374151' }
const dd = { margin: 0, color: '#111827' }

const warningBox = {
    marginBottom: 20,
    padding: '14px 16px',
    borderRadius: 14,
    background: '#fffbeb',
    border: '1px solid #fde68a',
    color: '#92400e',
    fontWeight: 700,
}

const payButton = {
    display: 'block',
    marginTop: 24,
    padding: '12px 16px',
    borderRadius: 10,
    background: '#111827',
    color: '#ffffff',
    fontWeight: 700,
    textAlign: 'center' as const,
    textDecoration: 'none',
}

const dangerButton = {
    marginTop: 12,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #fca5a5',
    background: '#fee2e2',
    color: '#991b1b',
    fontWeight: 700,
    cursor: 'not-allowed',
}

const backLink = {
    textDecoration: 'none',
    color: '#374151',
    fontWeight: 600,
}