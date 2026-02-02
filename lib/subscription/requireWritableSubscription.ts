import { fetchActiveSubscriptionSnapshotByUserId } from '@/lib/supabase/subscriptions.ts'

export async function requireWritableSubscription(userId: string) {
    const snap = await fetchActiveSubscriptionSnapshotByUserId(userId)

    if (
        snap.status === 'past_due' ||
        snap.status === 'expired'
    ) {
        throw new Error('SUBSCRIPTION_READ_ONLY')
    }

    if (!snap.isActive) {
        throw new Error('SUBSCRIPTION_INACTIVE')
    }

    return snap
}