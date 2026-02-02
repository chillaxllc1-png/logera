export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * ✅ Webhook 用 admin client（RLS 無効）
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase env vars')
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey)

export async function POST(req: NextRequest) {
    const body = await req.json()
    const supabase = supabaseAdmin

    console.log('payjp webhook received (mock)', body)

    const eventType = body?.type
    const data = body?.data?.object

    if (!eventType || !data) {
        return NextResponse.json(
            { error: 'invalid payload' },
            { status: 400 } as ResponseInit
        )
    }

    /**
     * ✅ event ごとに external_subscription_id を正しく決める
     */
    const externalSubscriptionId =
        eventType === 'charge.failed'
            ? data.subscription
            : data.id

    try {
        /**
         * 共通：既存 subscription を探す
         */
        const { data: existingSub, error: findError } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('external_subscription_id', externalSubscriptionId)
            .maybeSingle()

        if (findError) {
            console.error('find subscription error', findError)
            throw findError
        }

        switch (eventType) {
            case 'subscription.created':
            case 'subscription.updated': {
                const payload = {
                    status: data.status ?? 'active',
                    current_period_end: data.current_period_end
                        ? new Date(data.current_period_end * 1000).toISOString()
                        : null,
                    cancel_at_period_end:
                        data.cancel_at_period_end ?? false,
                    provider: 'payjp',
                    external_provider: 'payjp',
                    external_subscription_id: data.id,
                }

                if (existingSub) {
                    const { data: updated, error } = await supabase
                        .from('subscriptions')
                        .update(payload)
                        .eq('id', existingSub.id)
                        .select('id, status')

                    if (error) throw error
                    console.log('subscription.updated rows:', updated)
                } else {
                    await supabase.from('subscriptions').insert({
                        user_id: data.metadata?.user_id ?? null,
                        plan_id: data.metadata?.plan_id ?? null,
                        ...payload,
                    })
                }
                break
            }

            case 'subscription.deleted': {
                if (existingSub) {
                    await supabase
                        .from('subscriptions')
                        .update({
                            status: 'canceled',
                            canceled_at: new Date().toISOString(),
                        })
                        .eq('id', existingSub.id)
                }
                break
            }

            case 'charge.failed': {
                if (externalSubscriptionId) {
                    const { data: updated, error } = await supabase
                        .from('subscriptions')
                        .update({ status: 'past_due' })
                        .eq('external_subscription_id', externalSubscriptionId)
                        .select('id, status')

                    if (error) throw error

                    console.log('charge.failed rows:', updated)

                    if (!updated || updated.length === 0) {
                        console.error(
                            '❌ charge.failed matched 0 rows:',
                            externalSubscriptionId
                        )
                    }
                }
                break
            }

            default:
                console.log('Unhandled webhook event:', eventType)
        }

        return NextResponse.json({ ok: true })
    } catch (e) {
        console.error('mock webhook error', e)
        return NextResponse.json(
            { error: 'failed' },
            { status: 500 }
        )
    }
}