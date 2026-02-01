import { supabase } from './client'

export async function createSubscription({
    userId,
    plan = 'starter',
}: {
    userId: string
    plan?: string
}) {
    const { data, error } = await supabase
        .from('subscriptions')
        .insert({
            user_id: userId,
            plan,
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
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()

    if (error) {
        console.error('fetchSubscription error', error)
        return null
    }

    return data
}