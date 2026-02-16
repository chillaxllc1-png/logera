export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as Payjp from 'payjp'

// =========================
// 環境変数チェック（型安全）
// =========================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const payjpSecret = process.env.PAYJP_SECRET_KEY

if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined')
}

if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
}

if (!payjpSecret) {
    throw new Error('PAYJP_SECRET_KEY is not defined')
}

// =========================
// クライアント生成
// =========================
const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
})

const payjp = new (Payjp as any)(payjpSecret)

// =========================
// API本体
// =========================
export async function POST(req: NextRequest) {
    try {
        const { userId, token, amount } = await req.json()

        if (!userId || !token || !amount) {
            return new Response(
                JSON.stringify({ error: 'missing params' }),
                { status: 400 }
            )
        }

        // =========================
        // 🔒 1. リスクチェック
        // =========================
        const { data } = await supabaseAdmin
            .from('risk_controls')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()

        if (data?.status === 'restricted') {
            const now = new Date()
            const release = new Date(data.auto_release_at)

            // まだ制限中
            if (release > now) {
                return new Response(
                    JSON.stringify({
                        allowed: false,
                        reason: 'restricted',
                        autoReleaseAt: data.auto_release_at,
                    }),
                    { status: 403 }
                )
            }

            // ⏳ 自動解除
            await supabaseAdmin
                .from('risk_controls')
                .update({ status: 'normal' })
                .eq('user_id', userId)
        }

        // =========================
        // 💳 2. Pay.jp決済実行
        // =========================
        const charge = await payjp.charges.create({
            amount: Number(amount),
            currency: 'jpy',
            card: token,
            description: 'DatLynq payment',
            metadata: {
                user_id: userId,
            },
        })

        return new Response(
            JSON.stringify({
                allowed: true,
                chargeId: charge.id,
            }),
            { status: 200 }
        )

    } catch (err) {
        console.error('payment error:', err)

        return new Response(
            JSON.stringify({ error: 'payment failed' }),
            { status: 500 }
        )
    }
}