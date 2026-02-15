'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { FEATURES } from '@/lib/features'
import ButtonLink from '@/components/ui/ButtonLink'
import { cancelScheduledDowngrade } from '@/lib/supabase/subscriptions'
import { createOrUpdateSubscription } from '@/lib/supabase/subscriptions'
import { formatPlanLabel } from '@/lib/planLabel'
import type { FeatureKey } from '@/lib/features'
import { PLAN_COLORS } from '@/lib/planColors'
import type { PlanKey } from '@/lib/features'
import type { PlanColor } from '@/lib/planColors'
import { scheduleCancelSubscription } from '@/lib/supabase/subscriptions'
import { cancelScheduledCancellation } from '@/lib/supabase/subscriptions'

export default function Billing() {

    // =========================
    // Billing 遷移理由（Dashboard → Billing）
    // =========================
    const [billingIntent, setBillingIntent] = useState<
        'upgrade' | 'readonly' | null
    >(null)

    const {
        user,
        hasActiveSubscription,
        subscriptionPlan,
        subscriptionStatus,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        nextPlanId,
        userRequestedCancel,
        userRequestedPlanChange,
        isLoading,
        refreshSubscription,
        canUseFeature,
    } = useAuth()

    // =========================
    // Risk 制限モード
    // =========================
    const [isRestricted, setIsRestricted] = useState(false)

    useEffect(() => {
        if (!user) return

        const checkRisk = async () => {
            const { getSupabaseBrowserClient } = await import('@/lib/supabase/client')
            const supabase = getSupabaseBrowserClient()

            const { data } = await supabase
                .from('risk_controls')
                .select('status')
                .eq('user_id', user.id)
                .maybeSingle()

            setIsRestricted(data?.status === 'restricted')
        }

        checkRisk()
    }, [user])

    // =========================
    // その他の UI state
    // =========================
    const [showCanceled, setShowCanceled] = useState(false)

    // =========================
    // DEBUG: plan_features をフロントから直接確認
    // =========================
    useEffect(() => {

        import('@/lib/supabase/client').then(({ getSupabaseBrowserClient }) => {
            const supabase = getSupabaseBrowserClient()

            supabase
                .from('plan_features')
                .select('*')
                .then(res => {
                })
        })
    }, [])

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

    // =========================
    // Dashboard → Billing の遷移理由（1回だけ表示）
    // =========================
    useEffect(() => {
        const intent = sessionStorage.getItem('datlynq:billingIntent')
        if (intent === 'upgrade' || intent === 'readonly') {
            setBillingIntent(intent)
            sessionStorage.removeItem('datlynq:billingIntent')
        }
    }, [])

    const handleCancelDowngrade = async () => {
        if (!user) return
        if (!canOperateBilling) return

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

    // =========================
    // 解約予約（次回更新日から）
    // =========================
    const handleScheduleCancel = async () => {
        if (!user) return
        if (!canOperateBilling) return

        const ok = window.confirm(`
解約を予約しますか？

次回更新日以降の請求は発生しません。

・次回更新日までは利用できます
・解約は次回更新日前なら取り消せます
`)
        if (!ok) return

        try {
            await scheduleCancelSubscription(user.id)
            await refreshSubscription()
        } catch (e) {
            console.error(e)
            alert('解約処理に失敗しました。時間をおいて再度お試しください。')
        }
    }

    // =========================
    // 解約予約の取り消し（Undo）
    // =========================
    const handleUndoCancel = async () => {
        if (!user) return
        if (!canOperateBilling) return

        const ok = window.confirm(
            '解約予約を取り消しますか？\n\n' +
            '・解約は実行されません\n' +
            '・次回更新日以降も現在のプランのままご利用いただけます'
        )
        if (!ok) return

        try {
            await cancelScheduledCancellation(user.id) // ★ここだけ変更
            await refreshSubscription()
        } catch (e) {
            console.error(e)
            alert('解約予約の取り消しに失敗しました。')
        }
    }

    // 読み込み中（真っ白禁止）
    if (isLoading || hasActiveSubscription === null) {
        return <section style={loadingStyle}>読み込み中…</section>
    }

    // =========================
    // 現在プランとダウングレード先
    // =========================
    const currentPlan: PlanKey = subscriptionPlan ?? 'starter'
    const planColor = PLAN_COLORS[currentPlan]

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
    // 契約状態フラグ（UI制御用・ここだけ見ればOK）
    // =========================

    // 今この瞬間に利用可能か（UI全体の前提）
    const isActive =
        subscriptionStatus === 'active'

    // 解約予約中（解約は最優先）
    const isCancelScheduled =
        subscriptionStatus === 'active' &&
        cancelAtPeriodEnd === true &&
        nextPlanId === null &&
        userRequestedCancel === true

    // ダウングレード予約中（解約ではない）
    const isDowngradeScheduled =
        subscriptionStatus === 'active' &&
        cancelAtPeriodEnd === true &&
        nextPlanId !== null &&
        userRequestedPlanChange === true

    // 支払い失敗
    const isPastDue =
        subscriptionStatus === 'past_due'

    // 期限切れ
    const isExpired =
        subscriptionStatus === 'expired'

    // 完全解約済み
    const isCanceled =
        subscriptionStatus === 'canceled' ||
        subscriptionStatus === 'expired'

    // 読み取り専用（操作不可）
    const isReadonly = isPastDue || isExpired

    // =========================
    // 操作できるか（唯一のフラグ）
    // =========================
    const canOperateBilling =
        !isRestricted && !isReadonly && subscriptionStatus === 'active'

    // =============================
    // FEATURES 表示順（価値順）4プラン
    // =============================
    const FEATURE_ORDER = [
        'identity_match',
        'order_refund_history',
        'trend_analysis',
        'advanced_comparison',
        'risk_score',
        'enterprise_insights',
    ] as const satisfies readonly FeatureKey[]

    // =========================
    // ダウングレード予約（次回更新日から）
    // =========================
    const handleScheduleDowngrade = async () => {
        if (!user || !downgradeTargetPlan) return
        if (!canOperateBilling) return

        const ok = window.confirm(
            `次回更新日から ${downgradeTargetPlan.toUpperCase()} プランに変更します。\n\n現在のプランは有効期限まで利用できます。`
        )
        if (!ok) return

        try {
            await createOrUpdateSubscription({
                userId: user.id,
                planKey: downgradeTargetPlan, // 将来 next_plan_id 用。思想的に渡す
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

            {isRestricted && (
                <div
                    style={{
                        marginBottom: 20,
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        color: '#9a3412',
                        fontWeight: 700,
                        fontSize: 14,
                        lineHeight: 1.6,
                    }}
                >
                    🟠 このアカウントは現在 <strong>制限モード</strong> です
                    <br />
                    リスク検知により、一時的に契約操作（アップグレード・解約など）が制限されています。
                </div>
            )}

            {isReadonly && (
                <div
                    style={{
                        margin: '16px 0',
                        padding: '16px',
                        borderRadius: 16,
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        fontWeight: 700,
                        lineHeight: 1.6,
                    }}
                >
                    現在の操作は制限されています。
                    <br />
                    お支払い状況をご確認ください。
                    <div style={{ marginTop: 8 }}>
                        <Link
                            href="/checkout"
                            style={{ textDecoration: 'underline' }}
                        >
                            請求・契約を確認する
                        </Link>
                    </div>
                </div>
            )}

            {billingIntent === 'upgrade' && (
                <div
                    style={{
                        marginBottom: 20,
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: '#ecfeff',
                        border: '1px solid #67e8f9',
                        color: '#155e75',
                        fontWeight: 700,
                        fontSize: 14,
                        lineHeight: 1.6,
                    }}
                >
                    選択した機能は、上位プランでご利用いただけます。
                    <br />
                    現在のプラン内容をご確認ください。
                </div>
            )}

            {billingIntent === 'readonly' && (
                <div
                    style={{
                        marginBottom: 20,
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        fontWeight: 700,
                        fontSize: 14,
                        lineHeight: 1.6,
                    }}
                >
                    現在このアカウントは、支払い状況の確認が必要なため
                    <br />
                    一部の操作が制限されています。
                </div>
            )}

            {/* =========================
    サブスクリプション状態アラート
========================= */}

            {(isPastDue || isExpired || isCanceled) && (
                <div
                    style={{
                        margin: '16px 0',
                        padding: '14px 16px',
                        borderRadius: 14,

                        background: isPastDue
                            ? '#fef2f2'
                            : isExpired
                                ? '#fffbeb'
                                : '#f3f4f6',

                        border: isPastDue
                            ? '1px solid #fecaca'
                            : isExpired
                                ? '1px solid #fde68a'
                                : '1px solid #e5e7eb',

                        color: isPastDue
                            ? '#991b1b'
                            : isExpired
                                ? '#92400e'
                                : '#374151',

                        fontWeight: 700,
                        lineHeight: 1.6,
                    }}
                >
                    {/* メッセージ */}
                    {isPastDue && (
                        <>
                            お支払いに失敗しています。
                            <br />
                            お支払い方法を更新してください。
                        </>
                    )}

                    {isExpired && (
                        <>
                            サブスクリプションの有効期限が切れています。
                            <br />
                            再契約するとすべての機能が再度利用できます。
                        </>
                    )}

                    {isCanceled && (
                        <>
                            現在サブスクリプションは解約されています。
                            <br />
                            再契約するとすべての機能が再度利用できます。
                        </>
                    )}

                    {/* CTA：必ず1つ */}
                    <div style={{ marginTop: 8 }}>
                        <Link
                            href="/checkout"
                            style={{
                                textDecoration: 'underline',
                                fontWeight: 700,
                            }}
                        >
                            {isPastDue ? 'お支払いを再開する' : '再契約する'}
                        </Link>
                    </div>
                </div>
            )}

            {/* checkout キャンセル（決済途中離脱） */}
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
                        {isActive && (
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                {/* 主状態 */}
                                <span style={{ color: '#047857', fontWeight: 700 }}>
                                    有効
                                </span>

                                {/* 解約予約中（最優先） */}
                                {isCancelScheduled && (
                                    <span
                                        style={{
                                            marginLeft: 8,
                                            padding: '2px 8px',
                                            fontSize: 11,
                                            borderRadius: 999,
                                            background: '#fff1f2',
                                            color: '#9f1239',
                                            border: '1px solid #fecaca',
                                            fontWeight: 600,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        解約予約中
                                    </span>
                                )}

                                {/* ダウングレード予約中（解約でない場合のみ） */}
                                {!isCancelScheduled && isDowngradeScheduled && (
                                    <span
                                        style={{
                                            marginLeft: 8,
                                            padding: '2px 8px',
                                            fontSize: 11,
                                            borderRadius: 999,
                                            background: '#eff6ff',
                                            color: '#1e40af',
                                            border: '1px solid #bfdbfe',
                                            fontWeight: 600,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        ダウングレード予約中
                                    </span>
                                )}
                            </span>
                        )}

                        {!isActive && isCancelScheduled && (
                            <span style={{ color: '#b45309', fontWeight: 700 }}>
                                解約予約中
                            </span>
                        )}

                        {isPastDue && (
                            <span style={{ color: '#991b1b', fontWeight: 700 }}>
                                お支払いエラー
                            </span>
                        )}

                        {isExpired && (
                            <span style={{ color: '#92400e', fontWeight: 700 }}>
                                期限切れ
                            </span>
                        )}

                        {isCanceled && (
                            <span style={{ color: '#374151', fontWeight: 700 }}>
                                解約済み
                            </span>
                        )}
                    </Row>

                    <Row label="有効期限">
                        {periodEndLabel ? `${periodEndLabel} まで` : '—'}
                    </Row>

                    <Row label="契約プラン">
                        {hasActiveSubscription ? formatPlanLabel(currentPlan) : '未契約'}
                    </Row>

                    <Row label="月額料金">
                        {hasActiveSubscription
                            ? currentPlan === 'starter'
                                ? '29,800円（税込）'
                                : currentPlan === 'growth'
                                    ? '69,800円（税込）'
                                    : currentPlan === 'pro'
                                        ? '149,800円（税込）'
                                        : '300,000円〜（税込）'
                            : '—'}
                    </Row>

                    <Row label="支払方法">
                        {hasActiveSubscription
                            ? 'クレジットカード（pay.jp）'
                            : '—'}
                    </Row>
                </dl>

                {/* 解約予約の補足 */}
                {isCancelScheduled && currentPeriodEnd && (
                    <div
                        style={{
                            marginTop: 6,
                            fontSize: 13,
                            color: '#6b7280',
                            lineHeight: 1.5,
                        }}
                    >
                        次回更新日（
                        {new Date(currentPeriodEnd).toLocaleDateString('ja-JP')}
                        ）をもって契約が終了します。
                    </div>
                )}

                {/* ダウングレード予約の補足 */}
                {isDowngradeScheduled && currentPeriodEnd && (
                    <>
                        <div
                            style={{
                                marginTop: 12,
                                padding: '12px 14px',
                                borderRadius: 12,
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1e40af',
                                fontSize: 14,
                                fontWeight: 700,
                                lineHeight: 1.6,
                            }}
                        >
                            ダウングレード予約中です。
                            <br />
                            次回更新日（
                            {new Date(currentPeriodEnd).toLocaleDateString('ja-JP')}
                            ）から
                            <strong> {formatPlanLabel(downgradeTargetPlan)} </strong>
                            プランが適用されます。
                        </div>

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
                    </>
                )}
            </div>

            {/* =========================
   リスク分析機能（プラン差）
========================= */}
            <div style={{ ...card, marginTop: 24 }}>
                <h2 style={cardTitle}>リスク分析機能</h2>

                <div
                    style={{
                        padding: 16,
                        borderRadius: 14,
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                    }}
                >
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                        継続的な異常検知と通常時比較
                    </div>

                    <div
                        style={{
                            fontSize: 13,
                            color: '#6b7280',
                            lineHeight: 1.6,
                        }}
                    >
                        単日の数値だけでは、
                        異常の初期段階は判断できません。<br />
                        直近データとの比較・推移分析により、
                        継続的なリスクかどうかを可視化できます。
                    </div>

                    <div
                        style={{
                            marginTop: 12,
                            fontSize: 12,
                            color: '#9ca3af',
                            lineHeight: 1.6,
                        }}
                    >
                        ※ リスク指数・推移グラフ・原因分析は
                        Growth以上で利用可能です
                    </div>

                    {subscriptionPlan === 'starter' && (
                        <div style={{ marginTop: 16 }}>
                            <ButtonLink
                                href="/checkout?upgrade=growth"
                                variant="primary"
                                fullWidth
                            >
                                継続的なリスク監視を開始する
                            </ButtonLink>
                        </div>
                    )}
                </div>
            </div>

            {/* =========================
                プラン別 機能一覧
            ========================= */}
            <div style={{ ...card, marginTop: 24 }}>
                <h2 style={cardTitle}>プラン別 機能一覧</h2>

                <div
                    style={{
                        lineHeight: 1.6,
                        marginBottom: 20,
                        paddingBottom: 20,
                        borderBottom: '1px solid #e5e7eb',
                        background: '#fafafa',
                        borderRadius: 12,
                        padding: 12,
                    }}
                >
                    {/* Starter */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <strong style={{ color: '#4b5563', fontWeight: 600 }}>
                                Starter
                            </strong>
                            {currentPlan === 'starter' && (
                                <CurrentPlanBadge planColor={planColor} />
                            )}
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>
                            状況把握（まずはここから）
                        </div>
                    </div>

                    {/* Growth */}
                    <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <strong style={{ color: '#4b5563', fontWeight: 600 }}>
                                Growth
                            </strong>
                            {currentPlan === 'growth' && (
                                <CurrentPlanBadge planColor={planColor} />
                            )}
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>
                            判断精度を引き上げる主力プラン（最も選ばれています）
                        </div>
                    </div>

                    {/* Pro */}
                    <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <strong style={{ color: '#4b5563', fontWeight: 600 }}>
                                Pro
                            </strong>
                            {currentPlan === 'pro' && (
                                <CurrentPlanBadge planColor={planColor} />
                            )}
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>
                            高度分析・リスク予測（リスク管理を重視する方向け）
                        </div>
                    </div>
                </div>

                {/* Enterprise */}
                <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <strong style={{ color: '#4b5563', fontWeight: 600 }}>
                            Enterprise
                        </strong>
                        {currentPlan === 'enterprise' && (
                            <CurrentPlanBadge planColor={planColor} />
                        )}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>
                        個別最適化・専任サポート・高度分析対応（個別見積もり）
                    </div>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {FEATURE_ORDER.map((key) => {
                        const feature = FEATURES[key]
                        if (!feature) return null

                        const enabled = canUseFeature(feature.key)

                        return (
                            <li
                                key={feature.key}
                                style={{
                                    padding: '12px 14px',
                                    borderBottom: '1px solid #f3f4f6',
                                    background: enabled ? planColor.bg : 'transparent',
                                    borderRadius: 8,

                                    marginBottom: enabled ? 8 : 12,

                                    borderLeft: enabled
                                        ? `4px solid ${planColor.border}`
                                        : '4px solid transparent',
                                }}
                            >
                                {/* タイトル行 */}
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 4,
                                    }}
                                >
                                    <div style={{ fontWeight: 600 }}>
                                        {feature.name}
                                    </div>

                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            fontWeight: 700,
                                            fontSize: 12,
                                            color: enabled ? planColor.strong : '#92400e',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {enabled ? (
                                            <>
                                                <CheckIcon size={14} />
                                                <span>利用可能</span>
                                            </>
                                        ) : (
                                            <>
                                                <LockIcon size={14} />
                                                <span>上位プラン</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* short（常に表示） */}
                                <div
                                    style={{
                                        fontSize: 13,
                                        color: '#374151',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {feature.short}
                                </div>

                                {/* description（ロック時のみ） */}
                                {!enabled && (
                                    <div
                                        style={{
                                            marginTop: 8,
                                            fontSize: 12,
                                            color: '#6b7280',
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {feature.description}
                                    </div>
                                )}
                            </li>
                        )
                    })}
                </ul>
            </div>

            {/* =========================
    CTA（通常操作：契約中のみ）
========================= */}
            {isActive && !isReadonly && (
                <>
                    {/* アップグレード：Starter → Growth */}
                    {subscriptionPlan === 'starter' && (
                        <div style={{ marginTop: 24 }}>
                            <ButtonLink
                                href="/checkout?upgrade=growth"
                                variant="primary"
                                fullWidth
                            >
                                Growth プランへアップグレード
                            </ButtonLink>

                            {/* ダウングレード予約中のみ補足 */}
                            {isDowngradeScheduled && (
                                <p
                                    style={{
                                        marginTop: 6,
                                        fontSize: 12,
                                        color: '#1e40af',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    ※ ダウングレード予約は自動的に取り消されます
                                </p>
                            )}
                        </div>
                    )}

                    {/* アップグレード：Growth → Pro */}
                    {subscriptionPlan === 'growth' && (
                        <div style={{ marginTop: 24 }}>
                            <ButtonLink
                                href="/checkout?upgrade=pro"
                                variant="primary"
                                fullWidth
                                disabled={!canOperateBilling}
                            >
                                Pro プランへアップグレード
                            </ButtonLink>

                            {!canOperateBilling && (
                                <p style={{ marginTop: 8, fontSize: 12, color: '#9a3412', fontWeight: 700 }}>
                                    ※ 現在は制限中のため、この操作は実行できません
                                </p>
                            )}

                            {/* ダウングレード予約中のみ補足 */}
                            {isDowngradeScheduled && (
                                <p
                                    style={{
                                        marginTop: 6,
                                        fontSize: 12,
                                        color: '#1e40af',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    ※ ダウングレード予約は自動的に取り消されます
                                </p>
                            )}
                        </div>
                    )}

                    {/* アップグレード：Pro → Enterprise */}
                    {subscriptionPlan === 'pro' && (
                        <div style={{ marginTop: 24 }}>
                            <ButtonLink
                                href="/enterprise"
                                variant="primary"
                                fullWidth
                            >
                                Enterpriseについて問い合わせる
                            </ButtonLink>
                        </div>
                    )}

                    {/* ダウングレード予約 */}
                    {downgradeTargetPlan && (
                        <div style={{ marginTop: 16 }}>
                            <button
                                onClick={handleScheduleDowngrade}
                                disabled={!canOperateBilling}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    border: '1px solid #e5e7eb',
                                    background: '#ffffff',
                                    color: '#6b7280',
                                    fontWeight: 600,
                                    fontSize: 13,
                                    whiteSpace: 'nowrap',

                                    cursor: !canOperateBilling ? 'not-allowed' : 'pointer',
                                    opacity: !canOperateBilling ? 0.6 : 1,
                                }}
                            >
                                次回更新日から {downgradeTargetPlan.toUpperCase()} プランへ変更（予約）
                            </button>

                            {!canOperateBilling && (
                                <p style={{ marginTop: 6, fontSize: 12, color: '#9a3412', fontWeight: 700 }}>
                                    ※ 現在は制限中のため、この操作は実行できません
                                </p>
                            )}

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
                </>
            )}

            {/* =========================
    CTA（未契約・再契約）
========================= */}
            {!hasActiveSubscription && !isPastDue && !isExpired && !isCanceled && (
                <div style={{ marginTop: 24 }}>
                    <ButtonLink href="/checkout" fullWidth>
                        プランを利用開始
                    </ButtonLink>
                </div>
            )}
            {/* =========================
    解約
========================= */}
            <div style={{ ...card, marginTop: 24, background: '#ffffff' }}>
                <h2 style={cardTitle}>契約の管理</h2>

                {/* ダウングレード中の注意 */}
                {isDowngradeScheduled && (
                    <div
                        style={{
                            marginTop: 6,
                            marginBottom: 12,
                            padding: '12px 14px',
                            borderRadius: 10,
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#6b7280',
                            fontSize: 12,
                            fontWeight: 600,
                            lineHeight: 1.6,
                        }}
                    >
                        現在、ダウングレード予約中です。
                        <br />
                        ※ 解約を行うと、ダウングレード予約は自動的に取り消されます。
                    </div>
                )}

                {/* すでに解約予約中 */}
                {isCancelScheduled ? (
                    <>
                        <div
                            style={{
                                marginTop: 12,
                                padding: '12px 14px',
                                borderRadius: 10,
                                background: '#fff1f2',   // ← 解約の意味色はここだけ
                                border: '1px solid #fecaca',
                                color: '#991b1b',
                                fontSize: 14,
                                fontWeight: 700,
                                lineHeight: 1.6,
                            }}
                        >
                            解約予約中です。
                            <br />
                            {periodEndLabel && (
                                <>次回更新日（{periodEndLabel}）をもって停止します。</>
                            )}
                        </div>

                        <button
                            onClick={handleUndoCancel}
                            style={{
                                marginTop: 8,
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: 8,
                                border: '1px solid #fca5a5', // ← 解約色に寄せる
                                background: '#ffffff',
                                color: '#991b1b',
                                fontWeight: 700,
                                fontSize: 13,
                                cursor: 'pointer',
                            }}
                        >
                            解約予約を取り消す
                        </button>
                    </>
                ) : (
                    <>
                        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                            解約は次回更新日から適用されます。
                            <br />
                            次回更新日までは、すべての機能をご利用いただけます。
                        </p>

                        <button
                            onClick={handleScheduleCancel}
                            disabled={!canOperateBilling}
                            style={{
                                marginTop: 12,
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 10,
                                border: '1px solid #fca5a5',
                                background: '#fee2e2',
                                color: '#991b1b',
                                fontWeight: 700,
                                fontSize: 14,
                                cursor: !canOperateBilling ? 'not-allowed' : 'pointer',
                                opacity: !canOperateBilling ? 0.6 : 1,
                            }}
                        >
                            解約手続きを開始する
                        </button>
                    </>
                )}
            </div>

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

function CurrentPlanBadge({
    planColor,
}: {
    planColor: PlanColor
}) {
    return (
        <span
            style={{
                marginLeft: 8,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 999,
                background: planColor.soft,
                color: planColor.strong,
                border: `1px solid ${planColor.border}`,
                whiteSpace: 'nowrap',
            }}
        >
            現在のプラン
        </span>
    )
}

function CheckIcon({ size = 14 }: { size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 6 9 17l-5-5" />
        </svg>
    )
}

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