'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import { FEATURE_LIST } from '@/lib/features'
import ButtonLink from '@/components/ui/ButtonLink'
import LockedOverlay from '@/components/LockedOverlay'
import OrdersBarChart from '@/components/charts/OrdersBarChart'
import KpiTrendIcon from '@/components/ui/KpiTrendIcon'
import { createNotification } from '@/lib/notifications/createNotification'
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import LockedSection from '@/components/LockedSection'
import LockIcon from '@/components/icons/LockIcon'
import SearchIcon from '@/components/icons/SearchIcon'
import WarningTriangleIcon from '@/components/icons/WarningTriangleIcon'

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

// =========================
// KPI 表示ルール（Dashboard 専用）
// =========================

type KpiStatus = 'ok' | 'notice' | 'alert'

type KpiType = 'success' | 'failed' | 'refund' | 'late'

type KpiItem = {
    label: string
    value: number
    type: KpiType
    status: KpiStatus
}

const KPI_TITLE_BY_PERIOD = {
    1: '重要な取引の変化（本日）',
    7: '重要な取引の変化（直近7日間）',
    30: '重要な取引の変化（直近30日間）',
} as const

export default function Dashboard() {

    const router = useRouter()

    const {
        hasActiveSubscription,
        subscriptionStatus,
        subscriptionPlan,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        isLoading,
        user,
        canUseFeature,
        userRequestedCancel,
        userRequestedPlanChange,
    } = useAuth()

    // =========================
    // 制限モード状態
    // =========================
    const [riskStatus, setRiskStatus] = useState<{
        status: 'normal' | 'restricted'
        level?: number | null
        auto_release_at: string | null
        restricted_at?: string | null
        reason?: string | null
        updated_at?: string | null
    } | null>(null)

    // =========================
    // 今日のメトリクス state
    // =========================
    const [todayMetrics, setTodayMetrics] = useState<{
        orders_count: number
        refunds_count: number
        payment_failed_count: number
        late_night_payments_count: number
        suspicious_activity_count: number
    } | null>(null)

    // =========================
    // 今日の前日比（差分）
    // =========================
    const [todayDiff, setTodayDiff] = useState<{
        orders: number
        refunds: number
        failed: number
        late: number
    } | null>(null)

    // =========================
    // KPI アラート（理由表示用）
    // =========================
    const [alerts, setAlerts] = useState<{
        orders?: string
        refunds?: string
        failed?: string
        late?: string
    }>({})

    type MetricsRange = {
        day: string
        orders_count: number
        refunds_count: number
        payment_failed_count: number
        late_night_payments_count: number
        suspicious_activity_count: number
    }

    type Period = 1 | 7 | 30

    const [period, setPeriod] = useState<Period>(1)
    const [rangeMetrics, setRangeMetrics] = useState<MetricsRange[]>([])

    // =========================
    // グラフ選択状態（アクティブバー制御）
    // =========================
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    // =========================
    // 高リスクイベント（詳細表示用）
    // =========================
    const [suspiciousLogs, setSuspiciousLogs] = useState<{
        occurred_at: string
        amount: number | null
        suspicious_reasons?: string[] | null
    }[]>([])

    // =========================
    // 期間サマリー（7日 / 30日）
    // =========================
    const [periodSummary, setPeriodSummary] = useState<{
        totalOrders: number
        avgOrders: number
    } | null>(null)


    //
    //  開発環境では Enterprise 機能を強制ON
    //
    // 目的：
    // - ローカル環境でEnterprise UIを目視確認するため
    // - Pay.jp の契約状態やWebhookロジックは一切変更しない
    //
    // ⚠ 本番環境では必ず canUseFeature の判定に戻る
    //   → NODE_ENV === 'development' のときのみ有効
    //
    //   削除しないこと（Enterprise UI確認用）
    // const canUseEnterprise = canUseFeature('enterprise_insights') これが本番用
    const canUseEnterprise =
        process.env.NODE_ENV === 'development'
            ? true
            : canUseFeature('enterprise_insights')    // Enterpriseのみ

    // =========================
    // プラン能力（上位は下位を包含）
    // - Growth: 過去比較（7/30）と推移
    // - Pro:    原因特定（理由ランキング/詳細）
    // - Ent:    深掘り分析（Enterprise UI）
    // =========================
    const canUseGrowth =
        canUseFeature('advanced_comparison') ||
        canUseFeature('risk_score') ||
        canUseFeature('enterprise_insights')

    const canUsePro =
        canUseFeature('risk_score') ||
        canUseFeature('enterprise_insights')

    // Enterprise はあなたの既存 dev 強制ONの canUseEnterprise を使う      

    // =========================
    // 今日のメトリクス取得（JST）
    // =========================
    useEffect(() => {
        if (!user) return

        const fetchMetricsByPeriod = async () => {
            const supabase = getSupabaseBrowserClient()

            // =========================
            // JST 現在日
            // =========================
            const now = new Date()
            const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)

            // =========================
            // 期間計算（period = 1 / 7 / 30）
            // =========================
            const from = new Date(jstNow)
            from.setDate(from.getDate() - (period - 1))

            const fromDay = from.toISOString().slice(0, 10)
            const toDay = jstNow.toISOString().slice(0, 10)

            // =========================
            // DB 取得
            // =========================
            const { data, error } = await supabase
                .from('daily_metrics')
                .select('day, orders_count, refunds_count, payment_failed_count, late_night_payments_count, suspicious_activity_count')
                .eq('user_id', user.id)
                .gte('day', fromDay)
                .lte('day', toDay)
                .order('day', { ascending: true })
                .returns<MetricsRange[]>()

            if (error) {
                console.error('metrics fetch error', error)
                return
            }

            const rows: MetricsRange[] = data ?? []

            // =========================
            // ① 0埋めロジック
            // =========================

            // day → row の Map を作る
            const map = new Map<string, MetricsRange>()
            rows.forEach((row) => {
                map.set(row.day, row)
            })

            // 期間内の全日付配列（YYYY-MM-DD）
            const allDays: string[] = []
            const cursor = new Date(from)

            while (cursor <= jstNow) {
                allDays.push(cursor.toISOString().slice(0, 10))
                cursor.setDate(cursor.getDate() + 1)
            }

            // 0埋め済み配列
            const filled: MetricsRange[] = allDays.map((day) => {
                const row = map.get(day)

                return {
                    day,
                    orders_count: row?.orders_count ?? 0,
                    refunds_count: row?.refunds_count ?? 0,
                    payment_failed_count: row?.payment_failed_count ?? 0,
                    late_night_payments_count:
                        row?.late_night_payments_count ?? 0,
                    suspicious_activity_count:
                        row?.suspicious_activity_count ?? 0,
                }
            })

            // =========================
            // ② 一覧データ（グラフ用）
            // =========================
            setRangeMetrics(filled)

            // =========================
            // ③ 今日のメトリクス同期
            // =========================
            if (period === 1) {
                setTodayMetrics(
                    filled.length > 0 ? filled[filled.length - 1] : null
                )
            }

            // 今日と昨日
            const today = filled[filled.length - 1]
            const yesterday = filled[filled.length - 2]

            // =========================
            // 前日比 diff を「ローカル変数」で計算
            // =========================
            let diff: typeof todayDiff = null

            if (today && yesterday) {
                diff = {
                    orders: today.orders_count - yesterday.orders_count,
                    refunds: today.refunds_count - yesterday.refunds_count,
                    failed:
                        today.payment_failed_count - yesterday.payment_failed_count,
                    late:
                        today.late_night_payments_count -
                        yesterday.late_night_payments_count,
                }
            }

            // state に反映
            setTodayDiff(diff)

            /// =========================
            // alerts 判定（diff を使う）
            // =========================
            if (today && yesterday && diff) {
                const nextAlerts: typeof alerts = {}

                // -------------------------
                // 決済失敗（変化あり）
                // -------------------------
                if (today.payment_failed_count > 0 && diff.failed > 0) {
                    const title = '決済失敗の件数に変化が見られます'
                    const body =
                        '前日と比較して決済失敗の件数に変化があります。判断の参考としてご確認ください。'
                    const subject = '【DatLynq】決済失敗件数に変化が見られます'

                    // Dashboard内のアラート表示（短文）
                    nextAlerts.failed = '決済失敗件数に変化が見られます'

                    // ① アプリ内通知（ベル・履歴用）
                    await createNotification({
                        userId: user.id,
                        type: 'failed',
                        title,
                        body,
                    })

                    // ② メール通知
                    fetch('/api/alerts/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'failed',
                            subject,
                            message: body,
                            userId: user.id, // 既存実装に合わせて残す
                        }),
                    })
                }

                // -------------------------
                // 返金（変化あり）
                // -------------------------
                if (today.refunds_count > 0 && diff.refunds > 0) {
                    const title = '返金の件数に変化が見られます'
                    const body =
                        '前日と比較して返金の件数に変化があります。判断の参考としてご確認ください。'
                    const subject = '【DatLynq】返金件数に変化が見られます'

                    // Dashboard内のアラート表示（短文）
                    nextAlerts.refunds = '返金件数に変化が見られます'

                    // ① アプリ内通知（ベル・履歴用）
                    await createNotification({
                        userId: user.id,
                        type: 'refunds',
                        title,
                        body,
                    })

                    // ② メール通知
                    fetch('/api/alerts/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'refunds',
                            subject,
                            message: body,
                            userId: user.id, // send 側が受けるなら合わせる
                        }),
                    })
                }

                // -------------------------
                // 深夜決済（変化あり）
                // -------------------------
                if (today.late_night_payments_count > 0 && diff.late > 0) {
                    const title = '深夜時間帯の決済に変化が見られます'
                    const body =
                        '前日と比較して深夜時間帯の決済件数に変化があります。判断の参考としてご確認ください。'
                    const subject = '【DatLynq】深夜時間帯の決済に変化が見られます'

                    // Dashboard内のアラート表示（短文）
                    nextAlerts.late = '深夜時間帯の決済に変化が見られます'

                    // ① アプリ内通知（ベル・履歴用）
                    await createNotification({
                        userId: user.id,
                        type: 'late',
                        title,
                        body,
                    })

                    // ② メール通知
                    fetch('/api/alerts/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'late',
                            subject,
                            message: body,
                            userId: user.id,
                        }),
                    })
                }

                setAlerts(nextAlerts)
            } else {
                setAlerts({})
            }

            // =========================
            // ④ 合計・平均（7日 / 30日）
            // =========================
            if (period !== 1 && filled.length > 0) {
                const totalOrders = filled.reduce(
                    (sum, row) => sum + row.orders_count,
                    0
                )

                const avgOrders = Math.round(totalOrders / filled.length)

                setPeriodSummary({
                    totalOrders,
                    avgOrders,
                })
            } else {
                setPeriodSummary(null)
            }

            // =========================
            // 高リスク event_logs 取得（プラン別制御）
            // =========================

            let suspiciousData: {
                occurred_at: string
                amount: number | null
                suspicious_reasons?: string[] | null
            }[] | null = null

            if (canUsePro) {
                const { data } = await supabase
                    .from('event_logs')
                    .select('occurred_at, amount, suspicious_reasons')
                    .eq('user_id', user.id)
                    .not('suspicious_reasons', 'is', null)
                    .order('occurred_at', { ascending: false })
                    .limit(canUseEnterprise ? 10 : 5)

                suspiciousData = data
            } else {
                const { data } = await supabase
                    .from('event_logs')
                    .select('occurred_at, amount')
                    .eq('user_id', user.id)
                    .not('suspicious_reasons', 'is', null)
                    .order('occurred_at', { ascending: false })
                    .limit(5)

                suspiciousData = data
            }

            setSuspiciousLogs(suspiciousData ?? [])

            // =========================
            // 制限モード取得
            // =========================
            const { data: risk } = await supabase
                .from('risk_controls')
                .select('status, level, auto_release_at, restricted_at, reason, updated_at')
                .eq('user_id', user.id)
                .maybeSingle()

            console.log('risk_controls raw:', risk)

            if (risk?.status === 'restricted' && risk.auto_release_at) {
                const now = new Date()
                const release = new Date(risk.auto_release_at)
                if (release <= now) {
                    await supabase
                        .from('risk_controls')
                        .update({ status: 'normal' })
                        .eq('user_id', user.id)

                    // 画面も解除扱いにする
                    risk.status = 'normal'
                }
            }

            setRiskStatus(risk)
        }

        fetchMetricsByPeriod()
    }, [user, period, canUsePro, canUseEnterprise])

    // =========================
    // サブスクリプション状態（Dashboard 用）
    // =========================

    // 解約予約中（次回更新で完全停止）
    const isCancelScheduled =
        subscriptionStatus === 'active' &&
        cancelAtPeriodEnd === true &&
        userRequestedCancel === true

    // ダウングレード予約中（Billing 側で next_plan がある前提）
    const isDowngradeScheduled =
        false // Dashboard では判定しない（表示しない）

    // 読み取り専用（past_due / expired）
    const isReadOnly =
        subscriptionStatus === 'past_due' ||
        subscriptionStatus === 'expired'

    const [showWelcome, setShowWelcome] = useState(false)
    const [showActivated, setShowActivated] = useState(false)

    const [showUpgradeToast, setShowUpgradeToast] = useState(false)

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

    // ★ ここ！
    const alertCount = Object.keys(alerts).length

    // =========================
    // Growth誘導トースト
    // =========================
    const openUpgradeToast = () => {
        setShowUpgradeToast(true)

        setTimeout(() => {
            setShowUpgradeToast(false)
        }, 5000)
    }

    // =========================
    // リスク理由ランキング集計
    // =========================
    const riskReasonStats = React.useMemo(() => {
        if (!suspiciousLogs || suspiciousLogs.length === 0) {
            return []
        }

        const counts: Record<string, number> = {}
        let total = 0

        suspiciousLogs.forEach((log) => {
            log.suspicious_reasons?.forEach((reason) => {
                counts[reason] = (counts[reason] ?? 0) + 1
                total++
            })
        })

        return Object.entries(counts)
            .map(([reason, count]) => ({
                reason,
                count,
                percent: total > 0 ? Math.round((count / total) * 100) : 0,
            }))
            .sort((a, b) => b.count - a.count)
    }, [suspiciousLogs])

    const avgSuspicious =
        rangeMetrics.length > 0
            ? Math.round(
                rangeMetrics.reduce(
                    (s, r) => s + r.suspicious_activity_count,
                    0
                ) / rangeMetrics.length
            )
            : 0

    // =========================
    // 読み取り専用（past_due / expired）
    // =========================
    const isReadOnlyLocked =
        subscriptionStatus === 'past_due' ||
        subscriptionStatus === 'expired'

    // =========================
    // ロック判定（薄ロック）
    // =========================
    const lockGrowth = !canUseGrowth || isReadOnlyLocked
    const lockPro = !canUsePro || isReadOnlyLocked
    const lockEnterprise = !canUseEnterprise || isReadOnlyLocked

    // =========================
    // プラン別 period 制御
    // =========================
    const canUsePeriod7 = canUseGrowth
    const canUsePeriod30 = canUseGrowth

    // =========================
    // リスク指数（店舗内比較 / 0〜100）
    // - 改良1: 取引量（注文数）で補正
    // - 改良2: 件数ではなく「率（ordersあたり）」で評価
    // - 改良3: 直近3日トレンド（連続異常）を軽く加点
    // - 改良4: 重み付けして0〜100に正規化
    // =========================
    const { riskIndex, breakdown } = useMemo(() => {
        if (!todayMetrics || !periodSummary || rangeMetrics.length === 0) {
            return {
                riskIndex: 0,
                breakdown: [],
            }
        }

        // 0除算ガード
        const safeDiv = (a: number, b: number) => (b <= 0 ? 0 : a / b)

        // 期間全体の合計（率の母数を「期間の総注文数」にする）
        const totalOrders = rangeMetrics.reduce((s, r) => s + r.orders_count, 0)
        const totalRefunds = rangeMetrics.reduce((s, r) => s + r.refunds_count, 0)
        const totalFailed = rangeMetrics.reduce((s, r) => s + r.payment_failed_count, 0)
        const totalSuspicious = rangeMetrics.reduce((s, r) => s + r.suspicious_activity_count, 0)
        const totalLate = rangeMetrics.reduce((s, r) => s + r.late_night_payments_count, 0)

        // === 改良2：率ベース（今日）
        const todayOrders = todayMetrics.orders_count ?? 0
        const todayRefundRate = safeDiv(todayMetrics.refunds_count, todayOrders)
        const todayFailedRate = safeDiv(todayMetrics.payment_failed_count, todayOrders)
        const todaySuspiciousRate = safeDiv(todayMetrics.suspicious_activity_count, todayOrders)
        const todayLateRate = safeDiv(todayMetrics.late_night_payments_count, todayOrders)

        // === 改良2：率ベース（期間平均との差）
        const avgRefundRate = safeDiv(totalRefunds, totalOrders)
        const avgFailedRate = safeDiv(totalFailed, totalOrders)
        const avgSuspiciousRate = safeDiv(totalSuspicious, totalOrders)
        const avgLateRate = safeDiv(totalLate, totalOrders)

        // 「平均との差（上振れだけを見る）」を 0〜∞ の増加率で返す
        // avg=0 のとき：今日>0なら 1（強い異常）、今日=0なら0
        const upDev = (today: number, avg: number) =>
            avg === 0 ? (today > 0 ? 1 : 0) : Math.max(0, (today - avg) / avg)

        const refundDev = upDev(todayRefundRate, avgRefundRate)
        const failedDev = upDev(todayFailedRate, avgFailedRate)
        const suspiciousDev = upDev(todaySuspiciousRate, avgSuspiciousRate)
        const lateDev = upDev(todayLateRate, avgLateRate)

        // 重み
        const refundScore = refundDev * 35
        const failedScore = failedDev * 30
        const suspiciousScore = suspiciousDev * 20
        const lateScore = lateDev * 15

        const rawScore =
            refundScore +
            failedScore +
            suspiciousScore +
            lateScore

        const finalScore = Math.min(100, Math.round(rawScore))

        return {
            riskIndex: finalScore,
            breakdown: [
                { label: '返金', score: Math.round(refundScore) },
                { label: '決済失敗', score: Math.round(failedScore) },
                { label: '高リスク挙動', score: Math.round(suspiciousScore) },
                { label: '深夜帯', score: Math.round(lateScore) },
            ].filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
        }
    }, [todayMetrics, periodSummary, rangeMetrics])

    // =========================
    // リスク自動トースト（40以上で1回だけ表示）
    // =========================
    useEffect(() => {
        if (!riskIndex) return
        if (riskIndex < 70) return // ★ 70以上だけ
        if (canUseGrowth) return
        if (!user?.id) return

        const key = `datlynq:autoToastShown:${user.id}:${period}`

        if (!sessionStorage.getItem(key)) {
            setShowUpgradeToast(true)
            sessionStorage.setItem(key, 'true')

            // ★ ここでスクロール（トーストが出た後に動かすと自然）
            setTimeout(() => {
                const el = document.getElementById('risk-analysis')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 250)

            const duration = 6500
            const timer = setTimeout(() => setShowUpgradeToast(false), duration)
            return () => clearTimeout(timer)
        }
    }, [riskIndex, canUseGrowth, user?.id, period])

    // =========================
    // 70以上でAdvancedComparisonへ自動スクロール
    // =========================
    useEffect(() => {
        if (riskIndex < 70) return

        const el = document.getElementById('risk-analysis')
        if (!el) return

        const timer = setTimeout(() => {
            el.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            })
        }, 400)

        return () => clearTimeout(timer)
    }, [riskIndex])

    // =========================
    // 高リスク時 自動スクロール
    // =========================
    useEffect(() => {
        if (riskIndex < 70) return
        if (!showUpgradeToast) return

        const el = document.getElementById('risk-analysis')
        if (!el) return

        setTimeout(() => {
            el.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            })
        }, 600) // トースト表示後少し待つ
    }, [riskIndex, showUpgradeToast])

    // =========================
    // 直近期間の riskIndex 推移
    // =========================
    const riskIndexTrend = useMemo(() => {
        if (rangeMetrics.length === 0) return []

        const safeDiv = (a: number, b: number) => (b <= 0 ? 0 : a / b)

        const totalOrders = rangeMetrics.reduce((s, r) => s + r.orders_count, 0)
        const totalRefunds = rangeMetrics.reduce((s, r) => s + r.refunds_count, 0)
        const totalFailed = rangeMetrics.reduce((s, r) => s + r.payment_failed_count, 0)
        const totalSuspicious = rangeMetrics.reduce((s, r) => s + r.suspicious_activity_count, 0)
        const totalLate = rangeMetrics.reduce((s, r) => s + r.late_night_payments_count, 0)

        const avgRefundRate = safeDiv(totalRefunds, totalOrders)
        const avgFailedRate = safeDiv(totalFailed, totalOrders)
        const avgSuspiciousRate = safeDiv(totalSuspicious, totalOrders)
        const avgLateRate = safeDiv(totalLate, totalOrders)

        const upDev = (today: number, avg: number) =>
            avg === 0 ? (today > 0 ? 1 : 0) : Math.max(0, (today - avg) / avg)

        return rangeMetrics.map((day) => {
            const todayOrders = day.orders_count ?? 0

            const refundRate = safeDiv(day.refunds_count, todayOrders)
            const failedRate = safeDiv(day.payment_failed_count, todayOrders)
            const suspiciousRate = safeDiv(day.suspicious_activity_count, todayOrders)
            const lateRate = safeDiv(day.late_night_payments_count, todayOrders)

            const score =
                upDev(refundRate, avgRefundRate) * 35 +
                upDev(failedRate, avgFailedRate) * 30 +
                upDev(suspiciousRate, avgSuspiciousRate) * 20 +
                upDev(lateRate, avgLateRate) * 15

            return {
                day: day.day,
                riskIndex: Math.min(100, Math.round(score)),
            }
        })
    }, [rangeMetrics])

    // =========================
    // Enterprise 分析データ（比較付き完全版）
    // =========================
    const enterpriseStats = useMemo(() => {
        if (rangeMetrics.length === 0) return null

        const safeDiv = (a: number, b: number) => (b <= 0 ? 0 : a / b)

        const totalOrders = rangeMetrics.reduce((s, r) => s + r.orders_count, 0)
        const totalRefunds = rangeMetrics.reduce((s, r) => s + r.refunds_count, 0)
        const totalFailed = rangeMetrics.reduce((s, r) => s + r.payment_failed_count, 0)
        const totalSuspicious = rangeMetrics.reduce((s, r) => s + r.suspicious_activity_count, 0)
        const totalLate = rangeMetrics.reduce((s, r) => s + r.late_night_payments_count, 0)

        const avgRefundRate = safeDiv(totalRefunds, totalOrders)
        const avgFailedRate = safeDiv(totalFailed, totalOrders)
        const avgSuspiciousRate = safeDiv(totalSuspicious, totalOrders)
        const avgLateRate = safeDiv(totalLate, totalOrders)

        const latest = rangeMetrics[rangeMetrics.length - 1]

        const todayRefundRate = safeDiv(latest.refunds_count, latest.orders_count)
        const todayFailedRate = safeDiv(latest.payment_failed_count, latest.orders_count)
        const todaySuspiciousRate = safeDiv(latest.suspicious_activity_count, latest.orders_count)
        const todayLateRate = safeDiv(latest.late_night_payments_count, latest.orders_count)

        return {
            avgRefundRate,
            avgFailedRate,
            avgSuspiciousRate,
            avgLateRate,

            todayRefundRate,
            todayFailedRate,
            todaySuspiciousRate,
            todayLateRate,
        }

    }, [rangeMetrics])

    // =========================
    // 総合リスク判定 + メーター値 + 主因
    // =========================
    const { overallRiskLevel, meterValue, maxDiff, mainFactor } = useMemo(() => {

        if (!enterpriseStats) {
            return {
                overallRiskLevel: 'stable' as 'stable' | 'warning' | 'danger',
                meterValue: 0,
                maxDiff: 0,
                mainFactor: null as string | null,
            }
        }

        const metrics = [
            {
                label: '返金率',
                diff: Math.abs(
                    enterpriseStats.todayRefundRate - enterpriseStats.avgRefundRate
                ),
            },
            {
                label: '決済失敗率',
                diff: Math.abs(
                    enterpriseStats.todayFailedRate - enterpriseStats.avgFailedRate
                ),
            },
            {
                label: '高リスク率',
                diff: Math.abs(
                    enterpriseStats.todaySuspiciousRate - enterpriseStats.avgSuspiciousRate
                ),
            },
            {
                label: '深夜決済率',
                diff: Math.abs(
                    enterpriseStats.todayLateRate - enterpriseStats.avgLateRate
                ),
            },
        ]

        // 最大変動項目を取得
        const maxItem = metrics.reduce((a, b) =>
            a.diff > b.diff ? a : b
        )

        const maxDiff = maxItem.diff * 100

        let level: 'stable' | 'warning' | 'danger' = 'stable'

        if (maxDiff >= 3) level = 'danger'
        else if (maxDiff >= 1) level = 'warning'

        const meter = Math.min((maxDiff / 5) * 100, 100)

        return {
            overallRiskLevel: level,
            meterValue: meter,
            maxDiff,
            mainFactor: maxItem.label,   // ← ここが追加部分
        }

    }, [enterpriseStats])

    const safeMeterValue = Math.min(Math.max(meterValue, 0), 100)

    const [nowTick, setNowTick] = useState(Date.now())

    useEffect(() => {
        const t = setInterval(() => setNowTick(Date.now()), 30_000) // 30秒ごと
        return () => clearInterval(t)
    }, [])

    const restrictInfo = useMemo(() => {
        if (!riskStatus || riskStatus.status !== 'restricted') return null

        const releaseAt = riskStatus.auto_release_at ? new Date(riskStatus.auto_release_at) : null
        const remainingMs = releaseAt ? releaseAt.getTime() - nowTick : null

        const remainingMin =
            remainingMs === null ? null : Math.max(0, Math.ceil(remainingMs / 60_000))

        return {
            releaseAt,
            remainingMin,
        }
    }, [riskStatus, nowTick])

    const remainingMin = restrictInfo?.remainingMin ?? null

    // =========================
    // メーター数値アニメーション
    // =========================
    const [animatedValue, setAnimatedValue] = useState(0)

    useEffect(() => {
        let start = 0
        const duration = 600
        const stepTime = 16
        const totalSteps = duration / stepTime
        const increment = maxDiff / totalSteps

        const timer = setInterval(() => {
            start += increment
            if (start >= maxDiff) {
                setAnimatedValue(maxDiff)
                clearInterval(timer)
            } else {
                setAnimatedValue(start)
            }
        }, stepTime)

        return () => clearInterval(timer)
    }, [maxDiff])

    const [animatedMeter, setAnimatedMeter] = useState(0)

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedMeter(meterValue)
        }, 100)

        return () => clearTimeout(timer)
    }, [meterValue])

    // =========================
    // 異常日判定（riskIndex 70以上を異常とする）
    // =========================
    const abnormalDays = useMemo(() => {
        return new Set(
            riskIndexTrend
                .filter(d => d.riskIndex >= 70)
                .map(d => d.day)
        )
    }, [riskIndexTrend])

    useEffect(() => {
        console.log('subscriptionPlan:', subscriptionPlan)
        console.log('canUse advanced_comparison:', canUseFeature('advanced_comparison'))
        console.log('canUse risk_score:', canUseFeature('risk_score'))
        console.log('canUse enterprise_insights:', canUseFeature('enterprise_insights'))
    }, [subscriptionPlan])


    // =========================
    // ID特例用必ず消す
    // =========================
    useEffect(() => {
        if (!user) return

        console.log('🔥 CURRENT LOGGED IN USER ID:', user.id)
        alert('CURRENT USER ID: ' + user.id)
    }, [user])

    if (isLoading || hasActiveSubscription === null) {
        return <section style={{ padding: 40 }}>読み込み中…</section>
    }

    // =========================
    // KPI 用表示データ（period 対応）
    // =========================
    const displayMetrics = (() => {
        if (period === 1 && todayMetrics) {
            return {
                orders: todayMetrics.orders_count,
                refunds: todayMetrics.refunds_count,
                failed: todayMetrics.payment_failed_count,
                late: todayMetrics.late_night_payments_count,
            }
        }

        if (period !== 1 && rangeMetrics.length > 0) {
            return {
                orders: rangeMetrics.reduce((s, r) => s + r.orders_count, 0),
                refunds: rangeMetrics.reduce((s, r) => s + r.refunds_count, 0),
                failed: rangeMetrics.reduce((s, r) => s + r.payment_failed_count, 0),
                late: rangeMetrics.reduce(
                    (s, r) => s + r.late_night_payments_count,
                    0
                ),
            }
        }

        return null
    })()

    const kpis: Omit<KpiItem, 'status' | 'danger'>[] = displayMetrics
        ? [
            { label: '正常完了', value: displayMetrics.orders, type: 'success' },
            { label: '決済失敗', value: displayMetrics.failed, type: 'failed' },
            { label: '返金発生', value: displayMetrics.refunds, type: 'refund' },
            { label: '深夜決済', value: displayMetrics.late, type: 'late' },
        ]
        : []

    // ① まず KPI に status を付ける
    const kpisWithStatus: KpiItem[] = kpis.map((k) => {
        const status = getKpiStatus(k.type, k.value)
        return {
            ...k,
            status,
        }
    })

    // ② 次に「変化があるか」を判定
    const hasAnyChange = kpisWithStatus.some(
        (k) => k.status === 'notice' || k.status === 'alert'
    )

    // ③ 最後に表示用テキストを決める
    const kpiSummaryText = hasAnyChange
        ? '一部の取引指標に変化が見られます。判断の参考としてご確認ください。'
        : '現在の期間内で、特に目立った変化は検出されていません。'

    // 優先度: alert > notice > ok
    const rank = { alert: 2, notice: 1, ok: 0 } as const

    const toastContent = (() => {
        const isStarter = subscriptionPlan === 'starter'

        if (riskIndex >= 70) {
            return {
                title: 'リスクが急上昇しています',
                message: (
                    <>
                        直近データと比較して<strong>明確な異常傾向</strong>があります。
                        <br />
                        継続している場合、損失が拡大する可能性があります。
                    </>
                ),
                cta: isStarter
                    ? '今すぐ原因を確認する（Growth）'
                    : '原因を確認する',
            }
        }

        if (riskIndex >= 40) {
            return {
                title: '通常時との乖離が発生しています',
                message: (
                    <>
                        単日の数値では判断できません。
                        <br />
                        推移と平均との差分で継続性を確認できます。
                    </>
                ),
                cta: isStarter
                    ? '今すぐ原因を確認する（Growth）'
                    : '原因を確認する',
            }
        }

        return {
            title: '現在は安定しています',
            message: (
                <>
                    ただし、初期異常は単日では見えません。
                    <br />
                    将来リスクを可視化しますか？
                </>
            ),
            cta: isStarter
                ? '継続リスク分析をGrowthで解放する'
                : '将来リスクを確認する',
        }
    })()

    return (
        <section
            style={{ maxWidth: 980, margin: '0 auto', padding: '56px 20px' }}
        >

            {/* ===== Growth誘導トースト（最適化FIX版） ===== */}
            {showUpgradeToast && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: 'max(24px, env(safe-area-inset-bottom))',
                        left: '50%',
                        transform: 'translate(-50%, 0)',
                        background: '#111827',
                        color: '#ffffff',
                        padding: '20px 22px',
                        borderRadius: 16,
                        boxShadow: '0 24px 50px rgba(0,0,0,0.28)',
                        zIndex: 999,
                        maxWidth: 400,
                        width: 'calc(100% - 32px)',
                        textAlign: 'center',
                        borderLeft:
                            riskIndex >= 70
                                ? '4px solid #dc2626'
                                : riskIndex >= 40
                                    ? '4px solid #f59e0b'
                                    : '4px solid #10b981',
                    }}
                >
                    {/* タイトル */}
                    <div
                        style={{
                            fontWeight: 800,
                            marginBottom: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            fontSize: 15,
                        }}
                    >
                        {riskIndex >= 40 ? (
                            <div
                                style={{
                                    display: 'flex',
                                    animation: riskIndex >= 70 ? 'softPulse 1.6s ease-in-out infinite' : 'none',
                                }}
                            >
                                <WarningTriangleIcon size={18} color="#ffffff" />
                            </div>
                        ) : (
                            <SearchIcon size={18} color="#ffffff" />
                        )}

                        <span>{toastContent.title}</span>
                    </div>

                    {/* 説明 */}
                    <div
                        style={{
                            fontSize: 13,
                            opacity: 0.95,
                            lineHeight: 1.6,
                            marginBottom: 14,
                        }}
                    >
                        {toastContent.message}
                    </div>

                    {/* CTA */}
                    <button
                        onClick={() => {
                            const el = document.getElementById('risk-analysis')

                            if (el) {
                                el.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'start',
                                })
                            }

                            // Starterのみ、少し遅らせてアップグレード画面へ
                            if (subscriptionPlan === 'starter') {
                                setTimeout(() => {
                                    router.push('/checkout?upgrade=growth')
                                }, 800)
                            }
                        }}
                        style={{
                            display: 'inline-block',
                            padding: '10px 20px',
                            borderRadius: 999,
                            background: '#ffffff',
                            color: '#111827',
                            fontWeight: 800,
                            textDecoration: 'none',
                            fontSize: 13,
                            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease',
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'scale(0.96)'
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                        }}
                    >
                        {toastContent.cta}
                    </button>

                    {/* 補足 */}
                    <div
                        style={{
                            fontSize: 11,
                            marginTop: 12,
                            opacity: 0.55,
                        }}
                    >
                        ※ 7日・30日推移と通常時比較はGrowth以上で利用可能
                    </div>
                </div>
            )}

            {/* ===== 制限モード（運営者向け表示） ===== */}
            {riskStatus?.status === 'restricted' && (
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <WarningTriangleIcon size={18} color="#991b1b" />
                        <div>
                            <div style={{ fontWeight: 900 }}>
                                安全確認のため一時的に制限しています（運営者向け）
                            </div>

                            <div style={{ fontSize: 12, fontWeight: 600, color: '#7f1d1d', marginTop: 4 }}>
                                ※ エンドユーザー側には表示できません（決済が通らない状態として発生します）
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            marginTop: 10,
                            padding: 12,
                            borderRadius: 12,
                            background: '#fff',
                            border: '1px solid #fee2e2',
                            color: '#7f1d1d',
                            fontSize: 13,
                            fontWeight: 700,
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontSize: 11, color: '#9a3412', fontWeight: 800 }}>
                                    ステータス
                                </div>
                                <div>restricted</div>
                            </div>

                            <div>
                                <div style={{ fontSize: 11, color: '#9a3412', fontWeight: 800 }}>
                                    自動解除まで
                                </div>
                                <div>
                                    {remainingMin === null
                                        ? '未設定'
                                        : remainingMin <= 0
                                            ? '解除予定時刻を過ぎています（次回チェックで解除）'
                                            : `あと ${remainingMin} 分`}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: 11, color: '#9a3412', fontWeight: 800 }}>
                                    自動解除予定
                                </div>
                                <div>
                                    {riskStatus.auto_release_at
                                        ? new Date(riskStatus.auto_release_at).toLocaleString('ja-JP')
                                        : '未設定'}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: 11, color: '#9a3412', fontWeight: 800 }}>
                                    理由
                                </div>
                                <div>{riskStatus.reason ?? 'auto_detection'}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: 10 }}>

                            {/* ===== 手動解除ボタン（Level3専用） ===== */}
                            {riskStatus?.level === 3 && (
                                <div style={{ marginTop: 12 }}>
                                    <button
                                        onClick={async () => {
                                            if (!user?.id) return

                                            const res = await fetch('/api/risk/unlock', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ userId: user.id }),
                                            })

                                            if (res.ok) {
                                                alert('制限を解除しました')
                                                location.reload()
                                            } else {
                                                alert('解除に失敗しました')
                                            }
                                        }}
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: 10,
                                            background: '#991b1b',
                                            color: '#ffffff',
                                            fontWeight: 800,
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: 12,
                                        }}
                                    >
                                        手動で制限解除する
                                    </button>
                                </div>
                            )}

                            <a
                                href="#risk-analysis"
                                style={{
                                    display: 'inline-block',
                                    padding: '8px 12px',
                                    borderRadius: 10,
                                    background: '#111827',
                                    color: '#fff',
                                    textDecoration: 'none',
                                    fontWeight: 800,
                                    fontSize: 12,
                                }}
                            >
                                いま原因を確認する（リスク判断へ） →
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <h1 style={{ fontSize: 28 }}>取引リスクの状況把握</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                異常な変化や注意が必要な取引傾向を把握できます
            </p>

            {/* ===== Growth説明（スターターのみ表示） ===== */}
            {!canUseGrowth && (
                <div
                    style={{
                        textAlign: 'center',
                        fontSize: 13,
                        color: '#6b7280',
                        marginBottom: 16,
                        lineHeight: 1.6,
                    }}
                >
                    直近7日・30日の推移分析や通常時との比較により、
                    <br />
                    「一時的な変動か」「継続的な異常か」を判断できます。
                    <br />
                    <span style={{ fontWeight: 700, color: '#111827' }}>
                        Growthプラン以上で利用可能です。
                    </span>
                </div>
            )}

            {/* 期間切り替え */}
            <div
                style={{
                    margin: '16px 0 24px',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 8,
                }}
            >
                <PeriodButton
                    label="今日"
                    active={period === 1}
                    onClick={() => setPeriod(1)}
                />

                <PeriodButton
                    label="7日"
                    active={period === 7}
                    disabled={!canUsePeriod7}
                    onClick={() => {
                        if (!canUsePeriod7) {
                            openUpgradeToast()
                            return
                        }
                        setPeriod(7)
                    }}
                />

                <PeriodButton
                    label="30日"
                    active={period === 30}
                    disabled={!canUsePeriod30}
                    onClick={() => {
                        if (!canUsePeriod30) {
                            openUpgradeToast()
                            return
                        }
                        setPeriod(30)
                    }}
                />
            </div>

            {/* ★ Starter専用メッセージ追加 */}
            {!canUseGrowth && (
                <div
                    style={{
                        textAlign: 'center',
                        fontSize: 12,
                        color: '#6b7280',
                        marginTop: -12,
                        marginBottom: 24,
                        lineHeight: 1.6,
                    }}
                >
                    ※ 単日では「継続異常」は判別できません
                </div>
            )}

            {todayMetrics && (
                <div
                    style={{
                        margin: '32px 0',
                        padding: '16px',
                        borderRadius: 16,
                        border: '1px solid #e5e7eb',
                        background: '#f9fafb',
                    }}
                >
                    <h2 style={{ fontSize: 16, marginBottom: 8 }}>
                        {KPI_TITLE_BY_PERIOD[period]}
                    </h2>

                    {!canUseFeature('advanced_comparison') && (
                        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                            ※ 過去比較や傾向の詳細確認は Growth プラン以上で利用できます
                        </p>
                    )}

                    {/* 全体ステータス */}
                    <div
                        style={{
                            lineHeight: 1.6,
                            display: 'flex',
                            alignItems: 'flex-start', // ← アイコンと2行目のズレ防止
                            gap: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            color: alertCount > 0 ? '#b45309' : '#059669',
                            marginBottom: 12,
                            whiteSpace: 'nowrap',
                        }}
                        className="kpi-summary"
                    >
                        <KpiTrendIcon
                            type={alertCount > 0 ? 'danger' : 'ok'}
                            size={16}
                        />
                        <span
                            style={{
                                whiteSpace: 'pre-line', // ★ これが本命
                                lineHeight: 1.6,
                            }}
                        >
                            {kpiSummaryText}
                        </span>
                    </div>

                    {/* KPI 一覧 */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: 16,
                            maxWidth: 520,
                            margin: '0 auto',
                        }}
                    >
                        {kpisWithStatus.map((kpi) => (
                            <Metric
                                key={kpi.label}
                                label={kpi.label}
                                value={kpi.value}
                                status={kpi.status}
                                type={kpi.type}
                            />
                        ))}
                    </div>
                </div>
            )}

            {period !== 1 && periodSummary && (
                <div
                    style={{
                        margin: '24px 0',
                        padding: '16px',
                        borderRadius: 16,
                        border: '1px solid #e5e7eb',
                        background: '#ffffff',
                        textAlign: 'center',
                    }}
                >
                    <h2 style={{ fontSize: 16, marginBottom: 8 }}>
                        {period === 7
                            ? '直近7日間の取引規模（全体像）'
                            : '直近30日間の取引規模（全体像）'}
                    </h2>

                    <div style={{ fontSize: 14, color: '#374151' }}>
                        <div>合計注文数：<strong>{periodSummary.totalOrders}</strong> 件</div>
                        <div>1日平均：<strong>{periodSummary.avgOrders}</strong> 件</div>
                    </div>
                </div>
            )}

            {/* ===== 注文数グラフ（7日 / 30日） ===== */}
            {period !== 1 && rangeMetrics.length > 0 && (
                <div
                    style={{
                        width: '100%',
                        margin: '32px 0',
                        padding: 16,
                        borderRadius: 16,
                        border: '1px solid #e5e7eb',
                        background: '#ffffff',
                    }}
                >
                    <h2
                        style={{
                            textAlign: 'center',
                            fontSize: 16,
                            fontWeight: 700,
                            marginBottom: 8,
                        }}
                    >
                        {period === 7 ? '取引量の推移（直近7日間）' : '取引量の推移（直近30日間）'}
                    </h2>

                    {/* ✅ ここに追加（h2の直下） */}
                    <div style={{ textAlign: 'center', fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
                        <div style={{ fontWeight: 500, color: '#374151' }}>
                            日ごとの取引量の変化を確認できます
                        </div>
                        <div>
                            急な増減がある日は、上のKPI（決済失敗・返金・深夜帯）とあわせて確認してください
                        </div>
                    </div>

                    {period === 7 && periodSummary && (
                        <div
                            style={{
                                textAlign: 'center',
                                fontSize: 12,
                                color: '#6b7280',
                                marginBottom: 12,
                            }}
                        >
                            ※ 1日あたり平均 {periodSummary.avgOrders} 件
                        </div>
                    )}

                    {period === 30 && (
                        <div
                            style={{
                                textAlign: 'center',
                                fontSize: 12,
                                color: '#6b7280',
                                marginBottom: 12,
                            }}
                        >
                            ※ 直近30日間の注文推移
                        </div>
                    )}

                    <div style={{ width: '100%', maxWidth: 520, margin: '0 auto', minWidth: 0 }}>
                        <OrdersBarChart
                            data={rangeMetrics}
                            period={period}
                        />
                    </div>
                </div>
            )}

            {/* ===== Advanced Comparison（判断の参考） ===== */}
            {period !== 1 && periodSummary && (
                <div id="risk-analysis">
                    <LockedSection
                        locked={lockGrowth}
                        variant={isReadOnly ? 'readonly' : 'upgrade'}
                        href="/billing"
                        blurPx={4}
                        opacity={0.5}
                    >
                        <div
                            style={{
                                marginTop: 40,     // ★ 上だけ広げる（取引量の推移と距離を取る）
                                marginBottom: 32,
                                padding: 16,
                                borderRadius: 16,
                                border: '1px solid #e5e7eb',
                                background: '#ffffff',
                            }}
                        >
                            {/* ===== タイトル ===== */}
                            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
                                通常時との比較によるリスク判断
                            </h2>

                            <div
                                style={{
                                    marginBottom: 16,
                                    padding: 12,
                                    borderRadius: 12,
                                    background:
                                        riskIndex >= 70
                                            ? '#fef2f2'
                                            : riskIndex >= 40
                                                ? '#fff7ed'
                                                : '#ecfdf5',
                                    border: '1px solid #e5e7eb',
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{ fontSize: 12, color: '#6b7280' }}>
                                    リスク指数（店舗内比較）
                                </div>

                                <div
                                    style={{
                                        fontSize: 28,
                                        fontWeight: 800,
                                        color:
                                            riskIndex >= 70
                                                ? '#991b1b'
                                                : riskIndex >= 40
                                                    ? '#b45309'
                                                    : '#059669',
                                    }}
                                >
                                    {riskIndex}
                                </div>

                                {/* ← ここで閉じるのが超重要 */}

                                {riskIndex >= 70 && (
                                    <div
                                        style={{
                                            marginTop: 16,
                                            padding: 16,
                                            borderRadius: 14,
                                            background: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            animation: 'pulseWarning 1.6s ease-in-out 2',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: 800,
                                                color: '#991b1b',
                                                marginBottom: 6,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            <WarningTriangleIcon size={18} color="#991b1b" />
                                            <span>{mainFactor} の急変が検出されています</span>
                                        </div>

                                        <div
                                            style={{
                                                fontSize: 13,
                                                color: '#6b7280',
                                                lineHeight: 1.6,
                                                marginBottom: 12,
                                            }}
                                        >
                                            直近{period}日平均と比較して
                                            「{mainFactor}」が大きく上振れしています。
                                            放置すると損失拡大につながる可能性があります。
                                        </div>

                                        {!canUseGrowth && (
                                            <Link
                                                href="/billing"
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '10px 16px',
                                                    borderRadius: 10,
                                                    background: '#991b1b',
                                                    color: '#ffffff',
                                                    fontWeight: 800,
                                                    textDecoration: 'none',
                                                    fontSize: 14,
                                                }}
                                            >
                                                今すぐ原因を確認する（Growth）
                                            </Link>
                                        )}
                                    </div>
                                )}

                                {canUseGrowth && breakdown.length > 0 && (
                                    <div style={{ marginTop: 12 }}>
                                        {breakdown.map((item) => (
                                            <div
                                                key={item.label}
                                                style={{
                                                    fontSize: 12,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    marginBottom: 4,
                                                }}
                                            >
                                                <span>{item.label}</span>
                                                <span>+{item.score}点</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                                    {canUseGrowth
                                        ? `※ 直近${period}日間の平均との比較による参考値（0〜100）`
                                        : '※ 詳細な比較分析はGrowthプラン以上で利用できます'}
                                </div>
                            </div>

                            {riskIndex >= 40 && !canUseGrowth && (
                                <div
                                    style={{
                                        marginTop: 12,
                                        padding: 16,
                                        borderRadius: 14,
                                        background: '#fff7ed',
                                        border: '1px solid #fed7aa',
                                    }}
                                >
                                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                                        この変動、継続的な異常か判断できていますか？
                                    </div>

                                    <div
                                        style={{
                                            fontSize: 13,
                                            color: '#6b7280',
                                            marginBottom: 12,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        単日の数値だけでは、継続異常かどうか判断できません。
                                        過去平均との差分を確認する必要があります。
                                    </div>

                                    <Link
                                        href="/billing"
                                        style={{
                                            display: 'inline-block',
                                            padding: '8px 14px',
                                            borderRadius: 8,
                                            background: '#111827',
                                            color: '#ffffff',
                                            fontWeight: 700,
                                            textDecoration: 'none',
                                            fontSize: 13,
                                        }}
                                    >
                                        この変動が一時的か確認する（Growth）
                                    </Link>
                                </div>
                            )}

                            {/* ===== リスク指数 推移グラフ ===== */}
                            {canUseGrowth && riskIndexTrend.length > 0 && (
                                <div
                                    style={{
                                        width: '100%',
                                        margin: '32px 0',
                                        padding: 16,
                                        borderRadius: 16,
                                        border: '1px solid #e5e7eb',
                                        background: '#ffffff',
                                    }}
                                >
                                    <div
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            marginBottom: 8,
                                        }}
                                    >
                                        リスク指数の推移（直近{period}日間）
                                    </div>

                                    <div style={{ width: '100%', height: 220 }}>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <LineChart
                                                data={riskIndexTrend}
                                                margin={{ top: 20, right: 20, left: -30, bottom: 0 }}
                                            >
                                                <XAxis
                                                    dataKey="day"
                                                    tickFormatter={(value) => {
                                                        const d = new Date(value)
                                                        return `${d.getMonth() + 1}/${d.getDate()}`
                                                    }}
                                                    fontSize={11}
                                                />

                                                <YAxis domain={[0, 100]} fontSize={11} />

                                                <Tooltip
                                                    cursor={{ stroke: '#ef4444', strokeWidth: 1 }}
                                                    formatter={(value: any) => [`${value}`, 'リスク指数']}
                                                    labelFormatter={(label: any) => {
                                                        const d = new Date(label)
                                                        return `${d.getMonth() + 1}/${d.getDate()}`
                                                    }}
                                                />

                                                <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" />
                                                <ReferenceLine y={70} stroke="#dc2626" strokeDasharray="4 4" />

                                                <Line
                                                    type="monotone"
                                                    dataKey="riskIndex"
                                                    stroke="#2563eb"
                                                    strokeWidth={3}
                                                    dot={(props: any) => {
                                                        const { cx, cy, payload } = props
                                                        const isAbnormal = abnormalDays.has(payload.day)

                                                        return (
                                                            <circle
                                                                cx={cx}
                                                                cy={cy}
                                                                r={isAbnormal ? 6 : 3}
                                                                fill={isAbnormal ? '#dc2626' : '#2563eb'}
                                                                stroke="#ffffff"
                                                                strokeWidth={1}
                                                            />
                                                        )
                                                    }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {canUseGrowth && !canUsePro && riskIndex >= 40 && (
                                <div
                                    style={{
                                        marginTop: 24,
                                        padding: 18,
                                        borderRadius: 16,
                                        background: '#f9fafb',
                                        border: '1px solid #e5e7eb',
                                        textAlign: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 16,
                                            fontWeight: 800,
                                            marginBottom: 8,
                                            color: '#111827',
                                        }}
                                    >
                                        変動の「原因」まで特定しますか？
                                    </div>

                                    <div
                                        style={{
                                            fontSize: 13,
                                            color: '#6b7280',
                                            lineHeight: 1.6,
                                            marginBottom: 14,
                                        }}
                                    >
                                        推移は確認できました。
                                        <br />
                                        しかし、<strong>何がこの変動を引き起こしているのか</strong>は
                                        まだ特定できていません。
                                    </div>

                                    <button
                                        onClick={() => router.push('/checkout?upgrade=pro')}
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: 999,
                                            background: '#111827',
                                            color: '#ffffff',
                                            fontWeight: 800,
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: 13,
                                        }}
                                    >
                                        原因を特定する（Pro）
                                    </button>

                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: '#9ca3af',
                                            marginTop: 10,
                                        }}
                                    >
                                        ※ 理由ランキング・詳細ログ分析はPro以上で利用可能
                                    </div>
                                </div>
                            )}

                            {/* ===== 補足タイトル + 説明 ===== */}
                            <div
                                style={{
                                    fontSize: 12,
                                    color: '#6b7280',
                                    lineHeight: 1.5,
                                    marginTop: 8,
                                    marginBottom: 12,
                                }}
                            >
                                <div style={{ fontWeight: 500, color: '#374151' }}>
                                    直近の値と平均を比較し、注意すべき増減かどうかを確認します。
                                </div>
                                <div>
                                    一時的な変動の可能性もあるため、上の取引推移グラフとあわせて判断してください。
                                </div>
                            </div>

                            {/* ===== 比較テーブル（Growth以上） ===== */}
                            {canUseGrowth ? (
                                <AdvancedComparisonTable
                                    period={period}
                                    rows={[
                                        {
                                            label: '注文数',
                                            today: todayMetrics?.orders_count ?? 0,
                                            avg: periodSummary.avgOrders,
                                        },
                                        {
                                            label: '返金数',
                                            today: todayMetrics?.refunds_count ?? 0,
                                            avg: Math.round(
                                                rangeMetrics.reduce((s, r) => s + r.refunds_count, 0) /
                                                rangeMetrics.length
                                            ),
                                            danger: true,
                                        },
                                        {
                                            label: '決済失敗',
                                            today: todayMetrics?.payment_failed_count ?? 0,
                                            avg: Math.round(
                                                rangeMetrics.reduce(
                                                    (s, r) => s + r.payment_failed_count,
                                                    0
                                                ) / rangeMetrics.length
                                            ),
                                            danger: true,
                                        },
                                        {
                                            label: '高リスク挙動',
                                            today: todayMetrics?.suspicious_activity_count ?? 0,
                                            avg: avgSuspicious,
                                            danger: true,
                                        },
                                    ]}
                                />
                            ) : (
                                <div
                                    style={{
                                        marginTop: 20,
                                        padding: 16,
                                        borderRadius: 14,
                                        background: '#fff7ed',
                                        border: '1px solid #fed7aa',
                                    }}
                                >
                                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                                        今日の変動は「異常」ですか？
                                    </div>

                                    <div
                                        style={{
                                            fontSize: 13,
                                            color: '#6b7280',
                                            marginBottom: 12,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        単日の数値だけでは判断できません。
                                        <br />
                                        直近データとの比較が必要です。
                                    </div>

                                    <Link
                                        href="/billing"
                                        style={{
                                            display: 'inline-block',
                                            padding: '8px 14px',
                                            borderRadius: 8,
                                            background: '#111827',
                                            color: '#ffffff',
                                            fontWeight: 700,
                                            textDecoration: 'none',
                                            fontSize: 13,
                                        }}
                                    >
                                        過去と比較して判断する（Growth）
                                    </Link>
                                </div>
                            )}

                            {/* ===== リスク理由ランキング ===== */}
                            {canUseEnterprise && riskReasonStats.length > 0 && (
                                <div
                                    style={{
                                        marginTop: 24,
                                        marginBottom: 16,
                                        padding: 16,
                                        borderRadius: 16,
                                        border: '1px solid #e5e7eb',
                                        background: '#ffffff',
                                    }}
                                >
                                    <div style={{ fontWeight: 700, marginBottom: 10 }}>
                                        リスク理由ランキング（直近検知分）
                                    </div>

                                    {riskReasonStats.map((item, index) => (
                                        <div
                                            key={item.reason}
                                            style={{
                                                marginBottom: 10,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontSize: 13,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                <span>
                                                    {index + 1}. {item.reason}
                                                </span>
                                                <span>{item.percent}%</span>
                                            </div>

                                            <div
                                                style={{
                                                    height: 6,
                                                    background: '#e5e7eb',
                                                    borderRadius: 999,
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: `${item.percent}%`,
                                                        background: '#dc2626',
                                                        height: '100%',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <div
                                        style={{
                                            marginTop: 8,
                                            fontSize: 12,
                                            color: '#6b7280',
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        ※ 自動検知された理由の構成割合を表示しています（参考情報）
                                    </div>
                                </div>
                            )}

                            {/* ===== 高リスクイベント（参考情報） ===== */}
                            <div
                                style={{
                                    marginTop: 16,
                                    padding: 12,
                                    borderRadius: 12,
                                    border: '1px solid #fee2e2',
                                    background: '#fef2f2',
                                    fontSize: 13,
                                }}
                            >
                                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                                    高リスクイベント（参考情報）
                                </div>

                                {suspiciousLogs.length === 0 ? (
                                    <div style={{ color: '#7f1d1d' }}>
                                        現在、表示できる高リスクイベントはありません。
                                    </div>
                                ) : (
                                    <ul style={{ paddingLeft: 16 }}>
                                        {suspiciousLogs.map((log, i) => (
                                            <li key={i} style={{ marginBottom: 6 }}>
                                                <strong>
                                                    {new Date(log.occurred_at).toLocaleString('ja-JP')}
                                                </strong>
                                                {log.amount !== null && (
                                                    <> / 金額：{log.amount.toLocaleString()}円</>
                                                )}
                                                <br />
                                                <span style={{ fontSize: 12, color: '#7f1d1d' }}>
                                                    {canUsePro ? (
                                                        <span style={{ fontSize: 12, color: '#7f1d1d' }}>
                                                            理由：{log.suspicious_reasons?.join(', ')}
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: 12, color: '#9ca3af' }}>
                                                            理由：（Proで表示）
                                                        </span>
                                                    )}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                                    ※ 自動検知された挙動の内訳です（エンドユーザーには表示されません）
                                </div>
                            </div>

                            {/* ===== 注意書き ===== */}
                            <div
                                style={{
                                    marginTop: 10,
                                    fontSize: 12,
                                    color: '#6b7280',
                                    lineHeight: 1.6,
                                }}
                            >
                                本日と直近{period}日間の平均を比較した参考情報です。
                                数値のみで判断せず、推移や他の指標とあわせてご確認ください。
                            </div>

                            {!canUseGrowth && riskIndex >= 40 && (
                                <div
                                    style={{
                                        marginTop: 20,
                                        padding: 18,
                                        borderRadius: 16,
                                        background: '#111827',
                                        color: '#ffffff',
                                        textAlign: 'center',
                                    }}
                                >
                                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
                                        この異常、放置しますか？
                                    </div>

                                    <div
                                        style={{
                                            fontSize: 13,
                                            opacity: 0.9,
                                            lineHeight: 1.6,
                                            marginBottom: 14,
                                        }}
                                    >
                                        継続的な異常は、
                                        <strong>気づいたときには損失が拡大している</strong>
                                        ケースがあります。
                                        <br />
                                        推移比較により「一時的」か「構造的」かを判断できます。
                                    </div>

                                    <button
                                        onClick={() => router.push('/checkout?upgrade=growth')}
                                        style={{
                                            padding: '10px 18px',
                                            borderRadius: 999,
                                            background: '#ffffff',
                                            color: '#111827',
                                            fontWeight: 800,
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: 13,
                                        }}
                                    >
                                        継続異常を確認する（Growth）
                                    </button>

                                    <div
                                        style={{
                                            fontSize: 11,
                                            opacity: 0.6,
                                            marginTop: 10,
                                        }}
                                    >
                                        ※ 7日・30日比較はGrowth以上で利用可能
                                    </div>
                                </div>
                            )}
                        </div>
                    </LockedSection>
                </div>
            )}

            {/* ===== Enterprise Insights ===== */}
            {period !== 1 && enterpriseStats && (
                <>
                    <div
                        style={{
                            marginTop: 32,
                            marginBottom: 40,
                            padding: 16,
                            borderRadius: 16,
                            border: '1px solid #e5e7eb',
                            background: '#ffffff',
                        }}
                    >
                        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                            リスク傾向の詳細分析（Enterprise）
                        </h2>

                        <div
                            style={{
                                fontSize: 11,
                                color: '#9ca3af',
                                lineHeight: 1.6,
                                marginBottom: 10,
                            }}
                        >
                            当アカウントの過去データをもとにした参考分析です。
                            他店舗との比較ではありません。
                        </div>

                        {/* ===== 総合リスクメーター ===== */}
                        {enterpriseStats && (
                            <div
                                style={{
                                    marginBottom: 20,
                                    padding: 16,
                                    borderRadius: 14,
                                    background:
                                        overallRiskLevel === 'danger'
                                            ? '#fef2f2'
                                            : overallRiskLevel === 'warning'
                                                ? '#fefce8'
                                                : '#f0fdf4',
                                    border:
                                        overallRiskLevel === 'danger'
                                            ? '1px solid #fecaca'
                                            : overallRiskLevel === 'warning'
                                                ? '1px solid #fde68a'
                                                : '1px solid #bbf7d0',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 700,
                                        marginBottom: 4,
                                        color:
                                            overallRiskLevel === 'danger'
                                                ? '#dc2626'
                                                : overallRiskLevel === 'warning'
                                                    ? '#b45309'
                                                    : '#15803d',
                                    }}
                                >
                                    {overallRiskLevel === 'danger' && (
                                        <>🔴 変動大（主因：{mainFactor}）</>
                                    )}
                                    {overallRiskLevel === 'warning' && (
                                        <>🟡 要確認（主因：{mainFactor}）</>
                                    )}
                                    {overallRiskLevel === 'stable' && (
                                        <>🟢 安定</>
                                    )}
                                </div>

                                <div style={{ fontSize: 12, color: '#6b7280' }}>
                                    {overallRiskLevel === 'danger' && (
                                        <>
                                            直近平均と比較して <strong>{mainFactor}</strong> の変動が大きくなっています。
                                            詳細確認を推奨します。
                                        </>
                                    )}

                                    {overallRiskLevel === 'warning' && (
                                        <>
                                            <strong>{mainFactor}</strong> にやや変動が見られます。
                                            継続監視を推奨します。
                                        </>
                                    )}

                                    {overallRiskLevel === 'stable' && (
                                        <>
                                            直近平均と比較して大きな変動は見られません。
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ===== 横型リスクゲージ（完全安定FIX版） ===== */}
                        <div style={{ marginTop: 14 }}>
                            {/* ===== ゲージラッパー ===== */}
                            <div
                                style={{
                                    position: 'relative',
                                    height: 60, // ← ポインター含めた全体高さ
                                    marginBottom: 8,
                                }}
                            >
                                {/* ===== ゲージ本体 ===== */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: 16,
                                        borderRadius: 999,
                                        background:
                                            'linear-gradient(to right, #e5f7ef 0%, #fff6db 50%, #fde8e8 100%)',
                                    }}
                                />

                                {/* ===== ポインター ===== */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: 16, // ← ゲージの真上固定
                                        left: `${safeMeterValue}%`,
                                        transform:
                                            safeMeterValue < 10
                                                ? 'translateX(0%)'
                                                : safeMeterValue > 90
                                                    ? 'translateX(-100%)'
                                                    : 'translateX(-50%)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 4,
                                        transition: 'left 0.6s ease',
                                    }}
                                >
                                    {/* 数値チップ */}
                                    <div
                                        style={{
                                            padding: '2px 8px',
                                            borderRadius: 999,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            whiteSpace: 'nowrap',
                                            background: '#111827',
                                            color: '#ffffff',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                        }}
                                    >
                                        最大変動 {animatedValue.toFixed(2)}%
                                    </div>

                                    {/* 三角 */}
                                    <div
                                        style={{
                                            width: 0,
                                            height: 0,
                                            borderLeft: '7px solid transparent',
                                            borderRight: '7px solid transparent',
                                            borderTop: '10px solid #111827',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* ===== 目盛りラベル ===== */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: 10,
                                    color: '#94a3b8',
                                    marginBottom: 6,
                                }}
                            >
                                <span>0%</span>
                                <span>2.5%</span>
                                <span>5%</span>
                            </div>

                            {/* ===== 安定 / 要確認 / 変動大 ===== */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: 10,
                                    color: '#6b7280',
                                    marginBottom: 4,
                                }}
                            >
                                <span>安定</span>
                                <span>要確認</span>
                                <span>変動大</span>
                            </div>

                            {/* ===== 最大基準表示 ===== */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    fontSize: 10,
                                    color: '#94a3b8',
                                    marginBottom: 8,
                                }}
                            >
                                最大基準：5%
                            </div>

                            {/* ===== 自動コメント ===== */}
                            <div
                                style={{
                                    marginTop: 4,
                                    fontSize: 12,
                                    color: '#4b5563',
                                    lineHeight: 1.6,
                                }}
                            >
                                {overallRiskLevel === 'stable' && (
                                    <>直近{period}日平均と比較して大きな変動は見られません。</>
                                )}

                                {overallRiskLevel === 'warning' && (
                                    <>
                                        {mainFactor}が直近{period}日平均より
                                        約{maxDiff.toFixed(1)}%上振れしています。推移を継続確認してください。
                                    </>
                                )}

                                {overallRiskLevel === 'danger' && (
                                    <>
                                        {mainFactor}が直近{period}日平均より
                                        約{maxDiff.toFixed(1)}%大きく変動しています。詳細確認を推奨します。
                                    </>
                                )}
                            </div>

                            {/* ===== 注釈 ===== */}
                            <div
                                style={{
                                    fontSize: 11,
                                    color: '#9ca3af',
                                    marginTop: 6,
                                    marginBottom: 14,
                                }}
                            >
                                ※ 直近{period}日平均との差の最大値を表示
                            </div>
                        </div>

                        {lockEnterprise && (
                            <div
                                style={{
                                    marginTop: 12,
                                    padding: 16,
                                    borderRadius: 14,
                                    background: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                    fontSize: 13,
                                    color: '#374151',
                                    lineHeight: 1.6,
                                }}
                            >
                                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                                    🔍 主因分析サンプル
                                </div>

                                <div style={{ marginBottom: 8 }}>
                                    直近{period}日平均と比較して、
                                    <strong>「{mainFactor}」</strong>が主要変動要因になっています。
                                </div>

                                <div style={{ marginBottom: 8 }}>
                                    特に<strong>高額決済ユーザー集中日</strong>との相関が確認されています。
                                </div>

                                <div style={{ color: '#6b7280', fontSize: 12 }}>
                                    ※ 詳細な要因分解・ユーザー層別分析はEnterprise専用です
                                </div>

                                <div style={{ marginTop: 12, textAlign: 'center' }}>
                                    <a
                                        href="/enterprise"
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: 8,
                                            background: '#111827',
                                            color: '#ffffff',
                                            fontWeight: 700,
                                            textDecoration: 'none',
                                            fontSize: 13,
                                        }}
                                    >
                                        原因を特定する →
                                    </a>
                                </div>
                            </div>
                        )}

                        <div
                            style={{
                                marginTop: 32,
                                padding: 20,
                                borderRadius: 18,
                                background: '#111827',
                                color: '#ffffff',
                                textAlign: 'center',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 18,
                                    fontWeight: 800,
                                    marginBottom: 10,
                                }}
                            >
                                この変動、放置しますか？
                            </div>

                            <div
                                style={{
                                    fontSize: 13,
                                    lineHeight: 1.7,
                                    opacity: 0.9,
                                    marginBottom: 18,
                                }}
                            >
                                原因は特定できます。
                                <br />
                                しかし、
                                <strong>どの層をどう抑制するべきか</strong>は
                                Enterprise専用の戦略分析が必要です。
                            </div>

                            <button
                                onClick={() => router.push('/enterprise')}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: 999,
                                    background: '#ffffff',
                                    color: '#111827',
                                    fontWeight: 800,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                }}
                            >
                                損失を止める戦略を見る
                            </button>

                            <div
                                style={{
                                    fontSize: 11,
                                    marginTop: 12,
                                    opacity: 0.6,
                                }}
                            >
                                ※ Enterpriseはリスク層別分析・要因分解・予測分析を含みます
                            </div>
                        </div>
                    </div>

                    {/* ✅ ここから下は enterpriseStats がある時だけ描画（JSX崩れ防止 + runtime防止） */}
                    <div
                        style={{
                            fontSize: 11,
                            color: '#9ca3af',
                            marginBottom: 16,
                        }}
                    >
                        {period}日平均と最新日の比較
                    </div>

                    <div style={{ position: 'relative' }}>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                gap: 12,
                                opacity: lockEnterprise ? 0.4 : 1,
                                filter: lockEnterprise ? 'blur(3px)' : 'none',
                                pointerEvents: lockEnterprise ? 'none' : 'auto',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            {[
                                {
                                    label: '返金率',
                                    avg: enterpriseStats!.avgRefundRate,
                                    today: enterpriseStats!.todayRefundRate,
                                },
                                {
                                    label: '決済失敗率',
                                    avg: enterpriseStats!.avgFailedRate,
                                    today: enterpriseStats!.todayFailedRate,
                                },
                                {
                                    label: '高リスク率',
                                    avg: enterpriseStats!.avgSuspiciousRate,
                                    today: enterpriseStats!.todaySuspiciousRate,
                                },
                                {
                                    label: '深夜決済率',
                                    avg: enterpriseStats!.avgLateRate,
                                    today: enterpriseStats!.todayLateRate,
                                },
                            ].map((item) => {
                                const diff = (item.today - item.avg) * 100

                                // ▼ ① まずバー色
                                const barColor =
                                    diff > 0
                                        ? '#dc2626'
                                        : diff < 0
                                            ? '#2563eb'
                                            : '#9ca3af'

                                // ▼ ② 次に重要度（強さ）
                                const severity =
                                    Math.abs(diff) > 5
                                        ? 'high'
                                        : Math.abs(diff) > 2
                                            ? 'medium'
                                            : 'low'

                                // ▼ ③ ここに書く（←あなたが聞いてる部分）
                                const leftBorderColor =
                                    severity === 'high'
                                        ? diff > 0
                                            ? 'rgba(220,38,38,0.4)'
                                            : 'rgba(37,99,235,0.4)'
                                        : severity === 'medium'
                                            ? diff > 0
                                                ? 'rgba(220,38,38,0.25)'
                                                : 'rgba(37,99,235,0.25)'
                                            : 'rgba(148,163,184,0.3)'

                                return (
                                    <div
                                        key={item.label}
                                        style={{
                                            padding: 14,
                                            borderRadius: 12,
                                            border: '1px solid #f1f5f9',
                                            borderLeft: `4px solid ${leftBorderColor}`,
                                            background:
                                                severity === 'high'
                                                    ? diff > 0
                                                        ? '#fff5f5'
                                                        : '#f0f7ff'
                                                    : severity === 'medium'
                                                        ? diff > 0
                                                            ? '#fffafa'
                                                            : '#f8fbff'
                                                        : '#fafafa',
                                        }}
                                    >
                                        {/* タイトル */}
                                        <div style={{ fontWeight: 600, marginBottom: 10 }}>
                                            {item.label}
                                        </div>

                                        {/* ===== 7日平均（数値） ===== */}
                                        <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                            {period}日平均
                                        </div>
                                        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                                            {(item.avg * 100).toFixed(2)}%
                                        </div>

                                        {/* 7日平均バー */}
                                        <div
                                            style={{
                                                height: 6, // ← 細くする
                                                background: '#f1f5f9',
                                                borderRadius: 6,
                                                overflow: 'hidden',
                                                marginBottom: 12,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: '100%',
                                                    width: `${Math.min(item.avg * 100, 100)}%`,
                                                    background: '#cbd5e1',
                                                    borderRadius: 6,
                                                    transition: 'width 0.4s ease',
                                                }}
                                            />
                                        </div>

                                        {/* 区切り線 */}
                                        <div
                                            style={{
                                                height: 1,
                                                background: '#e5e7eb',
                                                margin: '10px 0',
                                            }}
                                        />

                                        {/* ===== 最新日（数値） ===== */}
                                        <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                            最新日
                                        </div>
                                        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                                            {(item.today * 100).toFixed(2)}%
                                        </div>

                                        {/* 最新日バー */}
                                        <div
                                            style={{
                                                height: 12, // ← 太くする
                                                background:
                                                    'linear-gradient(to right, #f1f5f9 0%, #f1f5f9 70%, #fff7f7 70%, #fff7f7 100%)',
                                                borderRadius: 6,
                                                overflow: 'hidden',
                                                marginBottom: 6,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: '100%',
                                                    width: `${Math.min(item.today * 100, 100)}%`,
                                                    background: barColor,
                                                    borderRadius: 6,
                                                    transition: 'width 0.4s ease',
                                                }}
                                            />
                                        </div>

                                        {/* 目盛り */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: 10,
                                                color: '#9ca3af',
                                                marginTop: -6,
                                                marginBottom: 8,
                                            }}
                                        >
                                            <span>0%</span>
                                            <span>50%</span>
                                            <span>100%</span>
                                        </div>

                                        {/* 区切り線（平均との差と分ける） */}
                                        <div
                                            style={{
                                                height: 1,
                                                background: '#f1f5f9',
                                                margin: '10px 0 8px',
                                            }}
                                        />

                                        {/* 平均差 */}
                                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>
                                            平均との差
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 14,
                                                fontWeight: 800,
                                                whiteSpace: 'nowrap',
                                                color: barColor,
                                            }}
                                        >
                                            {diff > 0 ? '▲' : diff < 0 ? '▼' : '–'}&nbsp;{Math.abs(diff).toFixed(2)}%
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {lockEnterprise && (
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    background: 'rgba(255,255,255,0.6)',
                                    backdropFilter: 'blur(4px)',
                                    borderRadius: 16,
                                    textAlign: 'center',
                                    padding: 20,
                                }}
                            >
                                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                                    あなたの損失、本当に止められますか？
                                </div>

                                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                                    詳細要因分析・専任設計はEnterprise専用です
                                </div>

                                <a
                                    href="/enterprise"
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: 10,
                                        background: '#111827',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                    }}
                                >
                                    Enterpriseを検討する
                                </a>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* =========================
    機能カード一覧
========================= */}
            <div
                style={{
                    ...grid,
                    marginTop: 48,   // ← これ追加
                }}
            >
                {FEATURE_LIST.map((feature) => {
                    const canUse = canUseFeature(feature.key)

                    const isLocked =
                        !canUse ||
                        subscriptionStatus === 'past_due' ||
                        subscriptionStatus === 'expired'

                    return (
                        <div
                            key={feature.key}
                            style={{ ...card, position: 'relative' }}
                        >
                            {isLocked && (
                                <LockedOverlay
                                    variant={
                                        subscriptionStatus === 'past_due' ||
                                            subscriptionStatus === 'expired'
                                            ? 'readonly'
                                            : 'upgrade'
                                    }
                                />
                            )}

                            <div
                                style={{ opacity: isLocked ? 0.6 : 1 }}
                            >
                                <h2>{feature.name}</h2>
                                <p>{feature.description}</p>

                                <ButtonLink
                                    href={isLocked ? '/billing' : feature.href}
                                    onClick={() => {
                                        if (isLocked) {
                                            sessionStorage.setItem(
                                                'datlynq:billingIntent',
                                                subscriptionStatus === 'past_due' ||
                                                    subscriptionStatus === 'expired'
                                                    ? 'readonly'
                                                    : 'upgrade'
                                            )
                                        }
                                    }}
                                >
                                    {isLocked ? 'プランを確認する' : '利用する'}
                                </ButtonLink>
                            </div>
                        </div>
                    )
                })}

                {/* 請求カード */}
                <div style={card}>
                    <h2>請求・契約</h2>
                    <p>プラン確認・変更・解約はこちら。</p>
                    <ButtonLink href="/billing">
                        請求・契約を確認する
                    </ButtonLink>
                </div>
            </div>

            {/* トーストアニメーション定義 */}
            <style jsx global>{`
  @keyframes slideUpFade {
    from {
      transform: translate(-50%, 20px);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }

  @keyframes pulseWarning {
  0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
  70% { box-shadow: 0 0 0 10px rgba(220,38,38,0); }
  100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
}
`}</style>

        </section>
    )
}

function getKpiStatus(type: KpiType, value: number): KpiStatus {
    if (type === 'success') {
        return 'ok'
    }

    if (type === 'failed' || type === 'refund') {
        if (value === 0) return 'ok'
        if (value === 1) return 'notice'
        return 'alert'
    }

    if (type === 'late') {
        if (value === 0) return 'ok'
        if (value <= 2) return 'notice'
        return 'alert'
    }

    return 'ok'
}

type RiskTrendPoint = { day: string; riskIndex: number }

function RiskTooltip({
    activeIndex,
    data,
}: {
    activeIndex: number | null
    data: RiskTrendPoint[]
}) {
    if (activeIndex === null) return null
    const p = data[activeIndex]
    if (!p) return null

    const parts = String(p.day).split('-')
    const mm = Number(parts[1])
    const dd = Number(parts[2])

    return (
        <div
            style={{
                background: '#111827',
                color: '#fff',
                padding: '8px 10px',
                borderRadius: 10,
                fontSize: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }}
        >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{`${mm}/${dd}`}</div>
            <div style={{ opacity: 0.9 }}>リスク指数：{p.riskIndex}</div>
        </div>
    )
}

function Metric({
    label,
    value,
    status,
    type,
}: {
    label: string
    value: number
    status: KpiStatus
    type: 'success' | 'failed' | 'refund' | 'late'
}) {
    const isPositive = type === 'success'

    // =========================
    // 数値の色ルール
    // =========================
    // 0            : 薄いグレー（何も起きていない）
    // notice       : オレンジ（要確認）
    // alert        : 赤（注意）
    // success > 0  : 緑（良い状態）
    const valueColor =
        value === 0
            ? '#9ca3af'
            : status === 'alert'
                ? '#991b1b'
                : status === 'notice'
                    ? '#d97706'
                    : '#059669'

    // =========================
    // ステータス文言
    // =========================
    // 正常完了系だけ特別扱い
    const labelText =
        isPositive
            ? value === 0
                ? '発生なし'
                : '正常に完了'
            : status === 'ok'
                ? '発生なし'
                : status === 'notice'
                    ? '要確認'
                    : '注意'

    // =========================
    // アイコン種別
    // =========================
    const iconType =
        status === 'alert'
            ? 'danger'
            : status === 'notice'
                ? 'warning'
                : 'ok'

    return (
        <div
            style={{
                padding: 14,
                borderRadius: 14,
                background: status === 'alert' ? '#fef2f2' : '#ffffff',
                border:
                    status === 'alert'
                        ? '1px solid #fecaca'
                        : '1px solid #e5e7eb',
            }}
        >
            {/* KPI タイトル */}
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>
                {label}
            </div>

            {/* 数値 */}
            <div
                style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: valueColor,
                }}
            >
                {value}
            </div>

            {/* 状態ラベル */}
            <div
                style={{
                    marginTop: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 600,
                }}
            >
                <KpiTrendIcon type={iconType} size={14} />
                <span>{labelText}</span>
            </div>
        </div>
    )
}

type LockIconFilledProps = {
    size?: number
}

function LockIconFilled({ size = 18 }: LockIconFilledProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="#111827"
        >
            <path d="M12 1C9.24 1 7 3.24 7 6v4H5c-1.1 0-2 .9-2 2v8c0 
      1.1.9 2 2 2h14c1.1 0 2-.9 
      2-2v-8c0-1.1-.9-2-2-2h-2V6c0-2.76-2.24-5-5-5zm-3 
      9V6c0-1.66 1.34-3 3-3s3 
      1.34 3 3v4H9z" />
            <circle cx="12" cy="16" r="1.5" fill="white" />
        </svg>
    )
}

function PeriodButton({
    label,
    active,
    disabled,
    onClick,
}: {
    label: string
    active: boolean
    disabled?: boolean
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '6px 14px',
                borderRadius: 999,
                border: active
                    ? '1px solid #111827'
                    : '1px solid #e5e7eb',
                background: active
                    ? '#111827'
                    : '#ffffff',
                color: active
                    ? '#ffffff'
                    : '#111827',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: disabled ? 0.7 : 1,
            }}
        >
            {label}
            {disabled && <LockIconFilled size={14} />}
        </button>
    )
}

function AdvancedComparisonTable({
    rows,
    period,
}: {
    rows: {
        label: string
        today: number
        avg: number
        danger?: boolean
    }[]
    period: 7 | 30
}) {
    return (
        <table
            style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
            }}
        >
            <thead>
                <tr style={{ color: '#6b7280' }}>
                    <th style={thLeft}>指標</th>
                    <th style={thCenter}>
                        {period === 7 || period === 30 ? '直近の値' : '本日'}
                    </th>
                    <th style={thCenter}>
                        {period === 7 ? '7日平均' : '30日平均'}
                    </th>
                    <th style={thRight}>差分</th>
                </tr>
            </thead>

            <tbody>
                {rows.map((row) => {
                    const diff = row.today - row.avg

                    return (
                        <tr key={row.label}>
                            <td style={tdLeft}>{row.label}</td>
                            <td style={tdCenter}>{row.today}</td>
                            <td style={tdCenter}>{row.avg}</td>
                            <td
                                style={{
                                    ...tdRight,
                                    fontWeight: 700,
                                    color:
                                        diff > 0
                                            ? row.danger
                                                ? '#dc2626'
                                                : '#059669'
                                            : diff < 0
                                                ? '#2563eb'
                                                : '#6b7280',
                                }}
                            >
                                {diff > 0 ? `+${diff}` : diff}
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )
}

/* styles */
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

const thLeft = {
    textAlign: 'left' as const,
    padding: '8px 6px',
    borderBottom: '1px solid #e5e7eb',
}

const thCenter = {
    textAlign: 'center' as const,
    padding: '8px 6px',
    borderBottom: '1px solid #e5e7eb',
}

const thRight = {
    textAlign: 'right' as const,
    padding: '8px 6px',
    borderBottom: '1px solid #e5e7eb',
}

const tdLeft = {
    padding: '10px 6px',
    borderBottom: '1px solid #f1f5f9',
}

const tdCenter = {
    padding: '10px 6px',
    textAlign: 'center' as const,
    borderBottom: '1px solid #f1f5f9',
}

const tdRight = {
    padding: '10px 6px',
    textAlign: 'right' as const,
    borderBottom: '1px solid #f1f5f9',
}