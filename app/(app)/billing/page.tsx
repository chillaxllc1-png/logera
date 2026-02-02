'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { FEATURES } from '@/lib/features'
import ButtonLink from '@/components/ui/ButtonLink'
import { cancelScheduledDowngrade } from '@/lib/supabase/subscriptions'
import { createOrUpdateSubscription } from '@/lib/supabase/subscriptions'

export default function Billing() {
    const {
        user,
        hasActiveSubscription,
        subscriptionPlan,
        subscriptionStatus,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        isLoading,
        refreshSubscription,
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

    const handleCancelDowngrade = async () => {
        if (!user) return

        const ok = window.confirm(
            'ダウングレード予約を取り消しますか？\n現在のプランは継続されます。'
        )
        if (!ok) return

        try {
            await cancelScheduledDowngrade(user.id)
            await refreshSubscription()
        } catch (e) {
            console.error(e)
            alert('処理に失敗しました。時間をおいて再度お試しください。')
        }
    }

    // 読み込み中（真っ白禁止）
    if (isLoading || hasActiveSubscription === null) {
        return <section style={loadingStyle}>読み込み中…</section>
    }

    // =========================
    // 現在プランとダウングレード先
    // =========================
    const currentPlan = subscriptionPlan ?? 'starter'

    const downgradeTargetPlan =
        currentPlan === 'pro'
            ? 'growth'
            : currentPlan === 'growth'
                ? 'starter'
                : null

    const periodEndLabel = currentPeriodEnd
        ? new Date(currentPeriodEnd).toLocaleDateString('ja-JP')
        : null

    // =========================
    // ダウングレード予約（次回更新日から）
    // =========================
    const handleScheduleDowngrade = async () => {
        if (!user || !downgradeTargetPlan) return

        const ok = window.confirm(
            `次回更新日から ${downgradeTargetPlan.toUpperCase()} プランに変更します。\n\n現在のプランは有効期限まで利用できます。`
        )
        if (!ok) return

        try {
            await createOrUpdateSubscription({
                userId: user.id,
                planId: downgradeTargetPlan, // 将来 next_plan_id 用。思想的に渡す
                mode: 'next_period',
            })
            await refreshSubscription()
        } catch (e) {
            console.error(e)
            alert('処理に失敗しました。時間をおいて再度お試しください。')
        }
    }

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
                            ? currentPlan === 'starter'
                                ? '19,800円（税込）'
                                : currentPlan === 'growth'
                                    ? '49,800円（税込）'
                                    : '99,800円（税込）'
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
                                lineHeight: 1.6,
                            }}
                        >
                            ダウングレード予約中：
                            <br />
                            現在のプランは{' '}
                            {new Date(currentPeriodEnd).toLocaleDateString('ja-JP')}
                            までご利用いただけます。
                            <br />
                            次回更新日から下位プランが適用されます。
                        </div>
                    )}

                {hasActiveSubscription === true && cancelAtPeriodEnd && (
                    <div
                        style={{
                            marginTop: 8,
                            padding: '8px 12px',
                            borderRadius: 8,
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            fontSize: 13,
                            color: '#374151',
                            fontWeight: 600,
                        }}
                    >
                        次回更新日からのプラン：
                        <strong style={{ marginLeft: 4 }}>
                            {currentPlan === 'pro'
                                ? 'Growth'
                                : currentPlan === 'growth'
                                    ? 'Starter'
                                    : '—'}
                        </strong>
                    </div>
                )}

                {hasActiveSubscription === true && cancelAtPeriodEnd && (
                    <button
                        onClick={handleCancelDowngrade}
                        style={{
                            marginTop: 10,
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid #d1d5db',
                            background: '#ffffff',
                            color: '#374151',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                        }}
                    >
                        ダウングレード予約を取り消す
                    </button>
                )}
            </div>

            {/* =========================
                プラン別 機能一覧
            ========================= */}
            <div style={{ ...card, marginTop: 24 }}>
                <h2 style={cardTitle}>プラン別 機能一覧</h2>

                <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
                    Starter：状況把握（まずはここから） ／{' '}
                    Growth：判断効率化（最も選ばれています） ／{' '}
                    Pro：高度分析・リスク予測（リスク管理を重視する方向け）
                </p>

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
                                    {enabled ? (
                                        <span style={{ color: '#065f46' }}>✔ 利用可能</span>
                                    ) : (
                                        <span
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                color: '#92400e',
                                                whiteSpace: 'nowrap',
                                                fontWeight: 700,
                                                fontSize: 12,
                                                opacity: 0.9,
                                            }}
                                        >
                                            <LockIcon size={14} />
                                            上位プラン
                                        </span>
                                    )}
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
                <div style={{ marginTop: 24 }}>
                    <ButtonLink href="/checkout" fullWidth>
                        プランを利用開始
                    </ButtonLink>
                </div>
            )}

            {hasActiveSubscription === true &&
                subscriptionPlan === 'starter' && (
                    <ButtonLink
                        href="/checkout?upgrade=growth"
                        variant="primary"
                        fullWidth
                    >
                        Growth プランへアップグレード
                    </ButtonLink>
                )}

            {hasActiveSubscription === true &&
                subscriptionPlan === 'growth' && (
                    <ButtonLink
                        href="/checkout?upgrade=pro"
                        variant="primary"
                        fullWidth
                    >
                        Pro プランへアップグレード
                    </ButtonLink>
                )}

            {hasActiveSubscription === true &&
                !cancelAtPeriodEnd &&
                downgradeTargetPlan && (
                    <div style={{ marginTop: 12 }}>
                        <button
                            onClick={handleScheduleDowngrade}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 10,
                                border: '1px solid #e5e7eb',
                                background: '#f9fafb',
                                color: '#374151',
                                fontWeight: 700,
                                fontSize: 14,
                                cursor: 'pointer',
                            }}
                        >
                            次回更新日から {downgradeTargetPlan.toUpperCase()} プランに変更
                        </button>

                        <p
                            style={{
                                marginTop: 6,
                                fontSize: 12,
                                color: '#6b7280',
                                lineHeight: 1.5,
                            }}
                        >
                            ※ 現在のプランは有効期限までご利用いただけます
                        </p>
                    </div>
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

function LockIcon({ size = 14 }: { size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: 6 }}
        >
            <circle cx="12" cy="16" r="1" />
            <rect x="3" y="10" width="18" height="12" rx="2" />
            <path d="M7 10V7a5 5 0 0 1 10 0v3" />
        </svg>
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