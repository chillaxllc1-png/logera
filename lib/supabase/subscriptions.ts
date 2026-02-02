import { getSupabaseBrowserClient } from './client'
import type { FeatureKey, PlanKey } from '@/lib/features'

/**
 * UI / AuthContext 用の単一スナップショット
 */
export type ActiveSubscriptionSnapshot = {
    isActive: boolean

    // 現在プラン
    planKey: PlanKey | null
    planId: string | null

    // 次回プラン（ダウングレード予約用）
    nextPlanKey: PlanKey | null
    nextPlanId: string | null

    featureKeys: FeatureKey[]

    // STEP7: status 拡張（pay.jp 前提）
    status: 'active' | 'canceled' | 'past_due' | 'expired' | 'inactive' | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
}

/**
 * subscription 作成（checkout 用）
 */
export async function createOrUpdateSubscription({
    userId,
    planId,
    mode = 'immediate', // 'immediate' | 'next_period'
}: {
    userId: string
    planId: string
    mode?: 'immediate' | 'next_period'
}) {
    const supabase = getSupabaseBrowserClient()

    // ① 最新 subscription を取得
    const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    // ② 既存がある場合
    if (existing) {
        // ---- ダウングレード予約（次回更新日から反映） ----
        if (mode === 'next_period') {
            const { data, error } = await supabase
                .from('subscriptions')
                .update({
                    cancel_at_period_end: true,
                    next_plan_id: planId,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)
                .select()
                .single()

            if (error) {
                console.error('scheduleDowngrade error', error)
                throw error
            }

            return data
        }

        // ---- 即時反映（アップグレード or 新規同等） ----
        // ⚠️ DatLynq 課金思想
        // - 即時反映は「アップグレードのみ」
        // - ダウングレード即時は仕様として禁止
        const { data, error } = await supabase
            .from('subscriptions')
            .update({
                plan_id: planId,
                status: 'active',
                cancel_at_period_end: false,
                updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single()

        if (error) {
            console.error('upgradeSubscription error', error)
            throw error
        }

        return data
    }

    // ③ subscription がなければ INSERT（新規）
    const { data, error } = await supabase
        .from('subscriptions')
        .insert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            cancel_at_period_end: false,
        })
        .select()
        .single()

    if (error) {
        console.error('createSubscription error', error)
        throw error
    }

    return data
}

/**
 * ダウングレード予約のキャンセル
 * - cancel_at_period_end を false に戻すだけ
 * - plan_id / status / 課金は一切触らない
 */
export async function cancelScheduledDowngrade(userId: string) {
    const supabase = getSupabaseBrowserClient()

    // 最新 subscription を取得
    const { data: existing, error: fetchErr } = await supabase
        .from('subscriptions')
        .select('id, cancel_at_period_end')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (fetchErr) {
        console.error('fetchSubscription error', fetchErr)
        throw fetchErr
    }

    // 予約がなければ何もしない（冪等）
    if (!existing || !existing.cancel_at_period_end) {
        return existing
    }

    const { data, error } = await supabase
        .from('subscriptions')
        .update({
            cancel_at_period_end: false,
            next_plan_id: null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

    if (error) {
        console.error('cancelDowngrade error', error)
        throw error
    }

    return data
}

/**
 * ユーザーの subscription 状態を1発で取得
 */
export async function fetchActiveSubscriptionSnapshotByUserId(
    userId: string
): Promise<ActiveSubscriptionSnapshot> {
    const supabase = getSupabaseBrowserClient()

    // ① 最新 subscription
    const { data: sub, error: subErr } = await supabase
        .from('subscriptions')
        .select(`
            id,
            plan_id,
            next_plan_id,
            status,
            current_period_end,
            cancel_at_period_end,
            created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    // 未契約 or エラー
    if (subErr || !sub) {
        if (subErr) console.error('fetch subscription error', subErr)
        return {
            isActive: false,
            planKey: null,
            planId: null,
            nextPlanKey: null,
            nextPlanId: null,
            featureKeys: [],
            status: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
        }
    }

    // ② 有効判定
    const now = new Date()
    const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end)
        : null

    const status =
        (sub.status as ActiveSubscriptionSnapshot['status']) ?? null

    const isActive =
        status === 'active' &&
        (!periodEnd || periodEnd.getTime() > now.getTime())

    // ③ 現在プラン key
    let planKey: PlanKey | null = null
    if (sub.plan_id) {
        const { data: plan, error: planErr } = await supabase
            .from('plans')
            .select('key')
            .eq('id', sub.plan_id)
            .single()

        if (planErr) {
            console.error('fetch plan error', planErr)
        }

        planKey = (plan?.key as PlanKey) ?? null
    }

    // ④ 次回プラン key（予約がある場合のみ）
    let nextPlanKey: PlanKey | null = null
    if (sub.next_plan_id) {
        const { data: nextPlan, error: nextPlanErr } = await supabase
            .from('plans')
            .select('key')
            .eq('id', sub.next_plan_id)
            .single()

        if (nextPlanErr) {
            console.error('fetch next plan error', nextPlanErr)
        }

        nextPlanKey = (nextPlan?.key as PlanKey) ?? null
    }

    // 非アクティブ時（expired / canceled など）
    if (!isActive) {
        return {
            isActive: false,
            planKey,
            planId: sub.plan_id ?? null,
            nextPlanKey,
            nextPlanId: sub.next_plan_id ?? null,
            featureKeys: [],
            status,
            currentPeriodEnd: sub.current_period_end ?? null,
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
        }
    }

    // ⑤ features（active かつ planKey がある時だけ）
    let featureKeys: FeatureKey[] = []

    if (planKey) {
        const { data: pf, error: pfErr } = await supabase
            .from('plan_features')
            .select(`
                features (
                    key
                )
            `)
            .eq('plan_id', sub.plan_id)

        if (pfErr) {
            console.error('fetch plan_features error', pfErr)
        }

        featureKeys =
            pf
                ?.map((r: any) => r.features?.key as FeatureKey)
                .filter(Boolean) ?? []
    }

    // ⑥ 正常 return
    return {
        isActive: true,
        planKey,
        planId: sub.plan_id ?? null,
        nextPlanKey,
        nextPlanId: sub.next_plan_id ?? null,
        featureKeys,
        status,
        currentPeriodEnd: sub.current_period_end ?? null,
        cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    }
}