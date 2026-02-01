import { getSupabaseBrowserClient } from './client'

export type PlanKey = 'starter' | 'pro'

export type ActiveSubscriptionSnapshot = {
    isActive: boolean
    planKey: PlanKey | null
    planId: string | null
    featureKeys: string[]
}

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
        })
        .select()
        .single()

    if (error) {
        console.error('createSubscription error', error)
        throw error
    }

    return data
}

export async function fetchSubscriptionByUserId(userId: string) {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
        .from('subscriptions')
        .select(
            `
            id,
            user_id,
            status,
            plans (
              id,
              key,
              name
            )
        `
        )
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()

    if (error) {
        console.error('fetchSubscription error', error)
        return null
    }

    return data
}

export async function fetchActiveSubscriptionSnapshotByUserId(
    userId: string
): Promise<ActiveSubscriptionSnapshot> {
    const supabase = getSupabaseBrowserClient()

    const { data: sub } = await supabase
        .from('subscriptions')
        .select('id, user_id, plan_id, status, created_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()

    if (!sub) {
        return {
            isActive: false,
            planKey: null,
            planId: null,
            featureKeys: [],
        }
    }

    const planId = sub.plan_id as string

    const { data: plan } = await supabase
        .from('plans')
        .select('id, key')
        .eq('id', planId)
        .single()

    const planKey = (plan?.key as PlanKey) ?? null

    let featureKeys: string[] = []

    const tryA = await supabase
        .from('plan_features')
        .select('feature_key')
        .eq('plan_id', planId)

    if (!tryA.error && tryA.data) {
        featureKeys = tryA.data.map((r: any) => r.feature_key)
    } else {
        const tryB = await supabase
            .from('plan_features')
            .select('feature_key')
            .eq('plan_key', planKey)

        if (!tryB.error && tryB.data) {
            featureKeys = tryB.data.map((r: any) => r.feature_key)
        }
    }

    return {
        isActive: true,
        planKey,
        planId,
        featureKeys,
    }
}