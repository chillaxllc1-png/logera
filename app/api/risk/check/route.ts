export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
})

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json()

        if (!userId) {
            return new Response(
                JSON.stringify({ error: 'missing userId' }),
                { status: 400 }
            )
        }

        const { data } = await supabaseAdmin
            .from('risk_controls')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()

        if (!data) {
            return new Response(
                JSON.stringify({ allowed: true }),
                { status: 200 }
            )
        }

        if (data.status === 'restricted') {
            const now = new Date()
            const release = new Date(data.auto_release_at)

            if (release <= now) {
                await supabaseAdmin
                    .from('risk_controls')
                    .update({ status: 'normal' })
                    .eq('user_id', userId)

                return new Response(
                    JSON.stringify({ allowed: true }),
                    { status: 200 }
                )
            }

            return new Response(
                JSON.stringify({
                    allowed: false,
                    reason: 'restricted',
                    autoReleaseAt: data.auto_release_at,
                }),
                { status: 200 }
            )
        }

        return new Response(
            JSON.stringify({ allowed: true }),
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