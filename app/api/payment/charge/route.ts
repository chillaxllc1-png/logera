export const runtime = 'nodejs'

import { NextRequest } from 'next/server'

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
        // ① リスクチェック
        // =========================
        const riskRes = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/risk/check`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            }
        )

        const riskResult = await riskRes.json()

        if (!riskResult.allowed) {
            return new Response(
                JSON.stringify({
                    error: 'payment_temporarily_restricted',
                    autoReleaseAt: riskResult.autoReleaseAt,
                }),
                { status: 403 }
            )
        }

        // =========================
        // ② ここにPay.jp処理を書く
        // =========================
        // const charge = await payjp.charges.create(...)
        // 今はまだ仮

        return new Response(
            JSON.stringify({ success: true }),
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