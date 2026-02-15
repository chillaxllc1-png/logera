export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: risks, error } = await supabase
      .from('risk_controls')
      .select('*')
      .eq('status', 'restricted')

    if (error) throw error

    for (const risk of risks ?? []) {
      const level = risk.level ?? 1

      const { data: recentMetrics, error: mErr } = await supabase
        .from('daily_metrics')
        .select('suspicious_activity_count')
        .eq('user_id', risk.user_id)
        .gte('day', getPastDate(level))

      if (mErr) throw mErr

      const hasRecentSuspicious =
        recentMetrics?.some((r) => (r.suspicious_activity_count ?? 0) > 0) ?? false

      if (!hasRecentSuspicious) {
        await downgradeUser(risk.user_id, level)
      }
    }

    // 成功時は NextResponse.json のままでOK
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)

    // ❌ NextResponse.json({error}, {status:500}) は型がズレてる環境がある
    // ✅ 標準 Response に逃がす（ここが最強に安定）
    return new Response(JSON.stringify({ error: 'failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }
}

function getPastDate(level: number) {
  const d = new Date()
  if (level === 3) d.setDate(d.getDate() - 14)
  if (level === 2) d.setDate(d.getDate() - 7)
  if (level === 1) d.setDate(d.getDate() - 3)
  return d.toISOString().slice(0, 10)
}

async function downgradeUser(userId: string, level: number) {
  if (level === 1) {
    await supabase
      .from('risk_controls')
      .update({ status: 'normal', level: 0 })
      .eq('user_id', userId)
  }

  if (level === 2) {
    await supabase
      .from('risk_controls')
      .update({ level: 1 })
      .eq('user_id', userId)
  }

  if (level === 3) {
    await supabase
      .from('risk_controls')
      .update({ level: 2 })
      .eq('user_id', userId)
  }
}