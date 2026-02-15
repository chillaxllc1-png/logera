import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =========================
// cancel-expired-subscriptions
// =========================

serve(async () => {
    console.log('[cron] start')
  console.log(
    `[cron] cancel-expired-subscriptions start ${new Date().toISOString()}`
  )

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[cron] Missing env vars')
      return new Response(
        JSON.stringify({ error: 'Missing env vars' }),
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const now = new Date().toISOString()

    // ① 期限切れ & 未解約
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, plan_id, next_plan_id, current_period_end')
      .eq('status', 'active')
      .eq('cancel_at_period_end', false)
      .lt('current_period_end', now)

    if (fetchError) {
      console.error('[cron] fetch error', fetchError)
      throw fetchError
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[cron] no expired subscriptions')
      return new Response(
        JSON.stringify({ message: 'No expired subscriptions' }),
        { status: 200 }
      )
    }

    console.log(`[cron] expired count: ${subscriptions.length}`)
    console.log(`[cron] expired subscriptions found: ${subscriptions.length}`)

    let updatedCount = 0

    // ② 更新処理
    for (const sub of subscriptions) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          next_plan_id: sub.next_plan_id ?? sub.plan_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id)

      if (updateError) {
        console.error('[cron] update error', {
          subscriptionId: sub.id,
          error: updateError,
        })
        continue
      }

      updatedCount++
    }

    console.log(`[cron] updated: ${updatedCount}`)
    console.log(
      `[cron] processed expired subscriptions: ${updatedCount}`
    )

    return new Response(
      JSON.stringify({
        message: 'Expired subscriptions processed',
        updatedCount,
      }),
      { status: 200 }
    )
  } catch (err) {
    console.error('[cron] error', err)
    console.error('[cron] fatal error', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500 }
    )
  }
})