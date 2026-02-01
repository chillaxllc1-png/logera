import { getSupabaseBrowserClient } from './client'
import type { FeatureKey, PlanKey } from '@/lib/features'

/**
 * UI / AuthContext 用の単一スナップショット
 */
export type ActiveSubscriptionSnapshot = {
    isActive: boolean
    planKey: PlanKey | null
    planId: string | null
    featureKeys: FeatureKey[]

    // STEP7: status 拡張（pay.jp 前提）
    status: 'active' | 'canceled' | 'past_due' | 'expired' | 'inactive' | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
}

/**
 * subscription 作成（checkout 用）
 */
export async function createSubscription({
    userId,
    planId,
}: {
    userId: string
    planId: string
}) {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
        .from('subscriptions')
        .insert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            // ✅ ここでは余計な列を入れない（SQL未反映でも壊さないため）
            // cancel_at_period_end: false,
            // current_period_end: null,
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
 * ユーザーの subscription 状態を1発で取得
 */
export async function fetchActiveSubscriptionSnapshotByUserId(
    userId: string
): Promise<ActiveSubscriptionSnapshot> {
    const supabase = getSupabaseBrowserClient()

    // ① 最新 subscription
    const { data: sub, error: subErr } = await supabase
        .from('subscriptions')
        .select(
            `
            id,
            plan_id,
            status,
            current_period_end,
            cancel_at_period_end,
            created_at
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    // 取得エラー or 未契約
    if (subErr || !sub) {
        if (subErr) console.error('fetch subscription error', subErr)
        return {
            isActive: false,
            planKey: null,
            planId: null,
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

    const status = (sub.status as ActiveSubscriptionSnapshot['status']) ?? null

    const isActive =
        status === 'active' &&
        (!periodEnd || periodEnd.getTime() > now.getTime())

    if (!isActive) {
        return {
            isActive: false,
            planKey: null,
            planId: sub.plan_id,
            featureKeys: [],
            status,
            currentPeriodEnd: sub.current_period_end ?? null,
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
        }
    }

    // ③ plan
    const { data: plan, error: planErr } = await supabase
        .from('plans')
        .select('id, key')
        .eq('id', sub.plan_id)
        .single()

    if (planErr) {
        console.error('fetch plan error', planErr)
    }

    const planKey = (plan?.key as PlanKey) ?? null

    // ④ features
    // planKey が null の時は引けないので空で返す（落とさない）
    if (!planKey) {
        return {
            isActive: true,
            planKey: null,
            planId: sub.plan_id,
            featureKeys: [],
            status,
            currentPeriodEnd: sub.current_period_end ?? null,
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
        }
    }

    const { data: pf, error: pfErr } = await supabase
        .from('plan_features')
        .select('feature_key')
        .eq('plan_key', planKey)

    if (pfErr) {
        console.error('fetch plan_features error', pfErr)
    }

    const featureKeys =
        pf?.map((r) => r.feature_key as FeatureKey) ?? []

    return {
        isActive: true,
        planKey,
        planId: sub.plan_id,
        featureKeys,
        status,
        currentPeriodEnd: sub.current_period_end ?? null,
        cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    }
}