import { fetchActiveSubscriptionSnapshotByUserId } from '@/lib/supabase/subscriptions'

export async function requireWritableSubscription(userId: string) {
  const snap = await fetchActiveSubscriptionSnapshotByUserId(userId)

  // 読み取り専用（支払い失敗・期限切れ）
  if (
    snap.status === 'past_due' ||
    snap.status === 'expired'
  ) {
    throw new Error('SUBSCRIPTION_READ_ONLY')
  }

  // 非アクティブ（未契約・完全解約など）
  if (snap.status !== 'active') {
    throw new Error('SUBSCRIPTION_INACTIVE')
  }

  return snap
}