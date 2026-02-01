import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

/**
 * ⚠️ pay.jp 審査前用・ダミーWebhook
 * - 署名検証なし
 * - ローカル / staging 用
 * - insert / update 両対応（壊れない）
 */
export async function POST(req: NextRequest) {
    const body = await req.json()
    const supabase = await createSupabaseServer()

    console.log('payjp webhook received (mock)', body)

    const eventType = body?.type
    const data = body?.data?.object

    if (!eventType || !data) {
        return NextResponse.json(
            { error: 'invalid payload' },
            { status: 400 }
        )
    }

    try {
        /**
         * 共通：既存 subscription を探す
         */
        const { data: existingSub, error: findError } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('external_subscription_id', data.id)
            .maybeSingle()

        if (findError) {
            console.error('find subscription error', findError)
            throw findError
        }

        switch (eventType) {
            /**
             * subscription 作成 or 更新
             */
            case 'subscription.created':
            case 'subscription.updated': {
                const payload = {
                    status: data.status ?? 'active',
                    current_period_end: data.current_period_end
                        ? new Date(
                            data.current_period_end * 1000
                        ).toISOString()
                        : null,
                    cancel_at_period_end:
                        data.cancel_at_period_end ?? false,
                    provider: 'payjp',
                    external_provider: 'payjp',
                    external_subscription_id: data.id,
                }

                if (existingSub) {
                    // 🔁 update
                    await supabase
                        .from('subscriptions')
                        .update(payload)
                        .eq('id', existingSub.id)
                } else {
                    // 🆕 insert（初回 webhook 用）
                    await supabase.from('subscriptions').insert({
                        user_id: data.metadata?.user_id ?? null,
                        plan_id: data.metadata?.plan_id ?? null,
                        ...payload,
                    })
                }

                break
            }

            /**
             * subscription 解約
             */
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

            /**
             * 支払い失敗
             */
            case 'charge.failed': {
                if (data.subscription) {
                    await supabase
                        .from('subscriptions')
                        .update({
                            status: 'past_due',
                        })
                        .eq(
                            'external_subscription_id',
                            data.subscription
                        )
                }
                break
            }

            default: {
                console.log('Unhandled webhook event:', eventType)
            }
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