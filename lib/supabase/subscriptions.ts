import { getSupabaseBrowserClient } from './client'
import type { FeatureKey, PlanKey } from '@/lib/features'

/* =========================
   ★ 共通ビリング操作ガード（API最終防波堤）
========================= */
async function assertCanOperateBilling(
  supabase: ReturnType<typeof getSupabaseBrowserClient>,
  userId: string
) {
  // ① リスク制限
  const { data: risk } = await supabase
    .from('risk_controls')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle()

  if (risk?.status === 'restricted') {
    throw new Error('billing_restricted')
  }

  // ② subscription 状態
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub || sub.status !== 'active') {
    throw new Error('billing_not_operable')
  }
}

// Subscription status（UI / AuthContext 共通）
export type SubscriptionStatus =
  | 'active'        // 正常
  | 'past_due'      // 支払い失敗（readonly）
  | 'expired'       // 期限切れ（readonly）
  | 'canceled'      // 完全解約
  | null            // 未契約

/**
 * UI / AuthContext 用の単一スナップショット
 */
export type ActiveSubscriptionSnapshot = {
  // 現在プラン
  planKey: PlanKey | null
  planId: string | null

  // 次回プラン（ダウングレード予約用）
  nextPlanKey: PlanKey | null
  nextPlanId: string | null

  featureKeys: FeatureKey[]

  status: SubscriptionStatus
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean

  // ★これが “勝手に出ない” の核
  userRequestedCancel: boolean
  userRequestedPlanChange: boolean
}

/**
 * subscription 作成（checkout 用）
 */
type SubscriptionMode = 'immediate' | 'next_period'

export async function createOrUpdateSubscription({
  userId,
  planKey,
  mode = 'immediate',
}: {
  userId: string
  planKey: PlanKey
  mode?: SubscriptionMode
}) {

  const supabase = getSupabaseBrowserClient()

  // ① 既存 subscription があるかを先に確認
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // ② 既存がある場合だけ操作ガード
  if (existing) {
    await assertCanOperateBilling(supabase, userId)
  }

  // ② planKey → planId
  const { data: plan, error: planErr } = await supabase
    .from('plans')
    .select('id')
    .eq('key', planKey)
    .single()

  if (planErr || !plan) {
    console.error('plan lookup failed', planErr)
    throw new Error('invalid plan key')
  }

  const planId = plan.id

  // =================================================
  // ③ 既存 subscription がある場合
  // =================================================
  if (existing) {

    // --- ダウングレード予約（次回更新日） ---
    if (mode === 'next_period') {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          next_plan_id: planId,

          // ★ ここが最重要
          user_requested_plan_change: true,
          user_requested_cancel: false,

          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    }

    // --- 即時変更 ---
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        plan_id: planId,
        cancel_at_period_end: false,
        next_plan_id: null,

        // ★ 予約フラグは必ずリセット
        user_requested_plan_change: false,
        user_requested_cancel: false,

        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // =================================================
  // ④ 既存がない場合（新規作成）
  // =================================================
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

  if (error) throw error
  return data
}

/**
 * ダウングレード予約のキャンセル
 * - cancel_at_period_end を false に戻すだけ
 * - plan_id / status / 課金は一切触らない
 */
export async function cancelScheduledDowngrade(userId: string) {
  const supabase = getSupabaseBrowserClient()
  await assertCanOperateBilling(supabase, userId)

  const { data: existing, error: fetchErr } = await supabase
    .from('subscriptions')
    .select('id, next_plan_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchErr) {
    console.error('fetchSubscription error', fetchErr)
    throw fetchErr
  }

  // ダウングレード予約がなければ何もしない（冪等）
  if (!existing || existing.next_plan_id === null) {
    return existing
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      next_plan_id: null,
      cancel_at_period_end: false,
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

export async function cancelScheduledCancellation(userId: string) {
  const supabase = getSupabaseBrowserClient()
  await assertCanOperateBilling(supabase, userId)

  const { data: existing, error: fetchErr } = await supabase
    .from('subscriptions')
    .select('id, cancel_at_period_end, next_plan_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchErr) {
    console.error('fetchSubscription error', fetchErr)
    throw fetchErr
  }

  if (!existing) return null

  // 「解約予約中」だけ取り消したいので
  // cancel_at_period_end = true かつ next_plan_id = null のときだけ解除
  if (existing.cancel_at_period_end !== true || existing.next_plan_id !== null) {
    return existing
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      cancel_at_period_end: false, // ★取り消しなので false
      // next_plan_id は元々 null のはずなので触らない
      user_requested_cancel: false, // ★取り消したので false に戻す
      user_requested_plan_change: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)
    .select()
    .single()

  if (error) {
    console.error('cancelScheduledCancellation error', error)
    throw error
  }

  return data
}

export async function scheduleCancelSubscription(userId: string) {
  const supabase = getSupabaseBrowserClient()
  await assertCanOperateBilling(supabase, userId)

  // 最新 subscription を取得
  const { data: existing, error: fetchErr } = await supabase
    .from('subscriptions')
    .select('id, cancel_at_period_end, next_plan_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchErr) {
    console.error('fetchSubscription error', fetchErr)
    throw fetchErr
  }

  if (!existing) return null

  /**
   * すでに解約予約中 かつ
   * next_plan_id が完全に消えているなら何もしない（冪等）
   */
  if (existing.cancel_at_period_end === true && existing.next_plan_id === null) {
    return existing
  }

  // 解約は「次回プラン」を必ず消す
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      cancel_at_period_end: true,
      next_plan_id: null,

      // ★ ユーザー操作フラグ
      user_requested_cancel: true,
      user_requested_plan_change: false,

      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)
    .select()
    .single()

  if (error) {
    console.error('scheduleCancel error', error)
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
    user_requested_cancel,
    user_requested_plan_change,
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
      planKey: null,
      planId: null,
      nextPlanKey: null,
      nextPlanId: null,
      featureKeys: [],
      status: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,

      userRequestedCancel: false,
      userRequestedPlanChange: false,
    }
  }

  // ② 有効判定（DatLynq 現仕様）
  // active なら有効扱い。period_end は課金完成後に使う
  const status =
    (sub.status as ActiveSubscriptionSnapshot['status']) ?? null

  const isActive =
    status === 'active' || status === 'past_due'

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
      planKey,
      planId: sub.plan_id ?? null,
      nextPlanKey,
      nextPlanId: sub.next_plan_id ?? null,
      featureKeys: [],
      status,
      currentPeriodEnd: sub.current_period_end ?? null,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,

      userRequestedCancel: sub.user_requested_cancel ?? false,
      userRequestedPlanChange: sub.user_requested_plan_change ?? false,
    }
  }

  // ⑤ features（active のとき）
  let featureKeys: FeatureKey[] = []

  if (planKey) {
    // plan_features → feature_id を取得
    const { data: pf, error: pfErr } = await supabase
      .from('plan_features')
      .select('feature_id')
      .eq('plan_id', sub.plan_id)

    if (pfErr) {
      console.error('fetch plan_features error', pfErr)
    }

    if (pf && pf.length > 0) {
      const featureIds = pf.map(r => r.feature_id)

      const { data: features, error: fErr } = await supabase
        .from('features')
        .select('key')
        .in('id', featureIds)

      if (fErr) {
        console.error('fetch features error', fErr)
      }

      featureKeys =
        features
          ?.map(f => f.key as FeatureKey)
          .filter(Boolean) ?? []
    }
  }

  // ⑥ 正常 return
  return {
    planKey,
    planId: sub.plan_id ?? null,
    nextPlanKey,
    nextPlanId: sub.next_plan_id ?? null,
    featureKeys,
    status,
    currentPeriodEnd: sub.current_period_end ?? null,
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,

    userRequestedCancel: sub.user_requested_cancel ?? false,
    userRequestedPlanChange: sub.user_requested_plan_change ?? false,
  }
}