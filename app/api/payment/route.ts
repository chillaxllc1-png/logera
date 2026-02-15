export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
})

export async function POST(req: NextRequest) {
    console.log('🔥 PAYMENT API HIT')

    try {
        const { userId, amount } = await req.json()

        if (!userId || !amount) {
            return new Response(
                JSON.stringify({ error: 'missing params' }),
                { status: 400 }
            )
        }

        // =========================
        // 🔒 1. リスクチェック（段階制対応）
        // =========================
        const { data } = await supabaseAdmin
            .from('risk_controls')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()

        if (data?.status === 'restricted') {
            const now = new Date()

            // 🔴 Level 3 → 手動解除のみ
            if (data.level === 3) {
                console.log('⛔ LEVEL 3 BLOCK')
                return new Response(
                    JSON.stringify({
                        allowed: false,
                        reason: 'restricted_level_3',
                    }),
                    { status: 403 }
                )
            }

            // 🟠 Level 1 or 2 → 自動解除判定
            if (data.auto_release_at) {
                const release = new Date(data.auto_release_at)

                if (release > now) {
                    console.log('⛔ PAYMENT BLOCKED (LEVEL', data.level, ')')
                    return new Response(
                        JSON.stringify({
                            allowed: false,
                            reason: 'restricted',
                            level: data.level,
                            autoReleaseAt: data.auto_release_at,
                        }),
                        { status: 403 }
                    )
                }

                // ⏳ 自動解除
                await supabaseAdmin
                    .from('risk_controls')
                    .update({ status: 'normal', level: 1 })
                    .eq('user_id', userId)

                console.log('✅ AUTO RELEASE')
            }
        }

        // 💳 今はまだモック成功
        return new Response(
            JSON.stringify({
                allowed: true,
                chargeId: 'test-charge-id',
            }),
            { status: 200 }
        )
    } catch (err) {
        console.error(err)
        return new Response(
            JSON.stringify({ error: 'server error' }),
            { status: 500 }
        )
    }
}