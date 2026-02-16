export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

/**
 * Supabase admin client（RLS 無効）
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
})

/**
 * utils
 */
function hash(value?: string | null) {
    if (!value) return null
    return crypto.createHash('sha256').update(value).digest('hex')
}

function getJstDay(iso: string) {
    const utc = new Date(iso)
    const jst = new Date(utc.getTime() + 9 * 60 * 60 * 1000)
    return jst.toISOString().slice(0, 10)
}

function getJstHour(iso: string) {
    const utc = new Date(iso)
    const jst = new Date(utc.getTime() + 9 * 60 * 60 * 1000)
    return jst.getHours()
}

// =========================
// 🔒 Webhook status ガード
// =========================
const SAFE_STATUS_TRANSITIONS: Record<string, string[]> = {
    active: ['past_due'],
    past_due: ['active'],
}

function canTransition(current: string | null, next: string) {
    if (!current) return false
    return SAFE_STATUS_TRANSITIONS[current]?.includes(next) ?? false
}

/**
 * 注文として数えるイベント
 */
const COUNT_AS_ORDER_EVENTS = new Set([
    'payment.succeeded',
    'charge.succeeded',
    'subscription.created',
])

export async function POST(req: NextRequest) {
    try {

        // =========================
        // 🔐 PAY.JP Webhookトークン検証（公式方式）
        // =========================

        // ① ヘッダーからトークン取得
        const token = req.headers.get('x-payjp-webhook-token')

        // ② 環境変数から正しいトークン取得
        const secret = process.env.PAYJP_WEBHOOK_SECRET

        // ③ 存在チェック
        if (!token || !secret) {
            console.log('❌ Missing webhook token or secret')
            return new Response('Unauthorized', { status: 401 })
        }

        // ④ 一致チェック
        if (token !== secret) {
            console.log('❌ Invalid webhook token')
            return new Response('Unauthorized', { status: 401 })
        }

        // =========================
        // 📦 JSONパース
        // =========================
        const body = await req.json()

        console.log('🔥 BODY:', body)

        const eventId: string | undefined = body?.id
        const eventType: string | undefined = body?.type
        const data = body?.data?.object

        // =========================
        // 🔁 二重実行防止
        // =========================
        if (eventId) {
            const { data: existingEvent } = await supabaseAdmin
                .from('event_logs')
                .select('id')
                .eq('source', 'payjp')
                .eq('event_id', eventId)
                .maybeSingle()

            if (existingEvent) {
                console.log('⚠️ Duplicate webhook event skipped:', eventId)
                return new Response(
                    JSON.stringify({ ok: true, duplicate: true }),
                    { status: 200 }
                )
            }
        }

        if (!eventType || !data) {
            return new Response(
                JSON.stringify({ error: 'invalid payload' }),
                { status: 400 }
            )
        }

        const userId: string | null = data?.metadata?.user_id ?? null
        if (!userId) {
            return new Response(
                JSON.stringify({ ok: true, skipped: true }),
                { status: 200 }
            )
        }

        const occurredAt =
            typeof data.created === 'number'
                ? new Date(data.created * 1000).toISOString()
                : new Date().toISOString()

        const day = getJstDay(occurredAt)
        const hour = getJstHour(occurredAt)

        // =========================
        // 判定フラグ
        // =========================
        const isOrder = COUNT_AS_ORDER_EVENTS.has(eventType)
        const isRefund =
            eventType.includes('refund') || eventType.includes('charge.refunded')
        const isPaymentFailed = eventType === 'charge.failed'
        const isLateNight = hour >= 0 && hour < 5
        const isLateNightPaymentEvent = isLateNight && (isPaymentFailed || isRefund)

        // =========================
        // 既存 daily_metrics 取得
        // =========================
        const { data: existingMetric, error: metricErr } = await supabaseAdmin
            .from('daily_metrics')
            .select(
                `
        id,
        orders_count,
        refunds_count,
        payment_failed_count,
        late_night_payments_count,
        suspicious_activity_count
      `
            )
            .eq('user_id', userId)
            .eq('day', day)
            .maybeSingle()

        if (metricErr) throw metricErr

        // =========================
        // Suspicious 判定材料
        // =========================
        const sameDayFailed =
            (existingMetric?.payment_failed_count ?? 0) + (isPaymentFailed ? 1 : 0)

        const from7 = new Date(`${day}T00:00:00+09:00`)
        from7.setDate(from7.getDate() - 6)
        const fromDay = from7.toISOString().slice(0, 10)

        const { data: avgRows, error: avgErr } = await supabaseAdmin
            .from('daily_metrics')
            .select('payment_failed_count')
            .eq('user_id', userId)
            .gte('day', fromDay)
            .lt('day', day)

        if (avgErr) throw avgErr

        const avgFailed =
            avgRows && avgRows.length >= 3
                ? avgRows.reduce((s, r) => s + (r.payment_failed_count ?? 0), 0) /
                avgRows.length
                : 0

        // =========================
        // suspiciousReasons 組み立て
        // =========================
        const suspiciousReasons: string[] = []

        if (isLateNightPaymentEvent) suspiciousReasons.push('late_night_payment')
        if (sameDayFailed >= 3) suspiciousReasons.push('same_day_failed_spike')
        if (avgFailed > 0 && sameDayFailed >= avgFailed * 2)
            suspiciousReasons.push('failed_vs_avg_spike')

        const isSuspicious = suspiciousReasons.length > 0

        // =========================
        // ✅ 段階制 制限モード判定（昇格対応版）
        // =========================

        let nextLevel: 1 | 2 | 3 | null = null

        // 判定ロジック
        if (sameDayFailed >= 10) {
            nextLevel = 3
        } else if (suspiciousReasons.length >= 3 || sameDayFailed >= 8) {
            nextLevel = 2
        } else if (suspiciousReasons.length >= 2 || sameDayFailed >= 5) {
            nextLevel = 1
        }

        // 既存状態取得（昇格用）
        const { data: currentRisk } = await supabaseAdmin
            .from('risk_controls')
            .select('level, status')
            .eq('user_id', userId)
            .maybeSingle()

        if (nextLevel) {
            const currentLevel = Number(currentRisk?.level ?? 0)

            // 🔥 既存より弱い場合は何もしない
            if (nextLevel <= currentLevel) {
                // 既存制限を維持（延長しない）
            } else {
                const finalLevel = nextLevel

                let autoReleaseAt: string | null = null

                if (finalLevel === 1) {
                    const d = new Date()
                    d.setMinutes(d.getMinutes() + 30)
                    autoReleaseAt = d.toISOString()
                }

                if (finalLevel === 2) {
                    const d = new Date()
                    d.setHours(d.getHours() + 2)
                    autoReleaseAt = d.toISOString()
                }

                if (finalLevel === 3) {
                    autoReleaseAt = null
                }

                await supabaseAdmin
                    .from('risk_controls')
                    .upsert(
                        {
                            user_id: userId,
                            status: 'restricted',
                            level: finalLevel,
                            reason: suspiciousReasons.join(','),
                            restricted_at: new Date().toISOString(),
                            auto_release_at: autoReleaseAt,
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: 'user_id' }
                    )
            }
        }

        // =========================
        // event_logs 保存
        // =========================
        const { error: logErr } = await supabaseAdmin.from('event_logs').insert({
            user_id: userId,
            source: 'payjp',
            event_id: eventId ?? null,
            event_type: eventType,
            occurred_at: occurredAt,

            order_id: eventId ?? data.order_id ?? data.id ?? null,
            amount: data.amount ?? null,
            currency: data.currency ?? null,
            status: data.status ?? null,

            ip_hash: hash(data.client_ip),
            email_domain: data.email ? data.email.split('@')[1] ?? null : null,
            user_agent_hash: hash(req.headers.get('user-agent')),

            suspicious_reasons: isSuspicious ? suspiciousReasons : null,
            payload: body,
        })

        if (logErr) throw logErr

        // =========================
        // daily_metrics 更新
        // =========================
        if (existingMetric) {
            const { error } = await supabaseAdmin
                .from('daily_metrics')
                .update({
                    orders_count: existingMetric.orders_count + (isOrder ? 1 : 0),
                    refunds_count: existingMetric.refunds_count + (isRefund ? 1 : 0),
                    payment_failed_count:
                        existingMetric.payment_failed_count + (isPaymentFailed ? 1 : 0),
                    late_night_payments_count:
                        existingMetric.late_night_payments_count +
                        (isLateNight && isOrder ? 1 : 0),
                    suspicious_activity_count:
                        existingMetric.suspicious_activity_count + (isSuspicious ? 1 : 0),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingMetric.id)

            if (error) throw error
        } else {
            const { error } = await supabaseAdmin.from('daily_metrics').insert({
                user_id: userId,
                day,
                orders_count: isOrder ? 1 : 0,
                refunds_count: isRefund ? 1 : 0,
                payment_failed_count: isPaymentFailed ? 1 : 0,
                late_night_payments_count: isLateNight && isOrder ? 1 : 0,
                suspicious_activity_count: isSuspicious ? 1 : 0,
            })

            if (error) throw error
        }

        return new Response(
            JSON.stringify({ ok: true }),
            { status: 200 }
        )
    } catch (e) {
        console.error('webhook error', e)
        return new Response(
            JSON.stringify({ error: 'failed' }),
            { status: 500 }
        )
    }
}