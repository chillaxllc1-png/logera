export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
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

        const { error } = await supabaseAdmin
            .from('risk_controls')
            .update({
                status: 'normal',
                level: 1,
                auto_release_at: null,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)

        if (error) throw error

        return new Response(
            JSON.stringify({ ok: true }),
            { status: 200 }
        )
    } catch (e) {
        console.error('unlock error', e)
        return new Response(
            JSON.stringify({ error: 'failed' }),
            { status: 500 }
        )
    }
}