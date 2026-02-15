import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY!)

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// JSTで YYYY-MM-DD を作る
function jstDateString(offsetDays = 0) {
    const now = new Date()
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    jst.setDate(jst.getDate() + offsetDays)
    return jst.toISOString().slice(0, 10)
}

// 1日1回だけ送るガード
async function sendOncePerDay(params: {
    userId: string
    type: 'failed' | 'refunds' | 'late'
    title: string
    body: string
    subject: string
    html: string
    to: string[]
}) {
    const today = jstDateString(0)

    const { error } = await supabase.from('alert_logs').insert({
        user_id: params.userId,
        alert_type: params.type,
        alert_date: today,
    })

    if (error) return { skipped: true }

    // UI通知（Dashboardと同一思想）
    await supabase.from('notifications').insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        is_read: false,
    })

    // メール送信
    await resend.emails.send({
        from: 'DatLynq Alerts <alert@datlynq.com>',
        to: params.to,
        subject: params.subject,
        html: params.html,
    })

    return { success: true }
}

export async function GET(req: Request) {
    // Cron ガード
    const secret = req.headers.get('x-cron-secret')
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
        return Response.json({ ok: false }, { status: 401 })
    }

    const targetDay = jstDateString(-1) // 昨日
    const prevDay = jstDateString(-2)   // 一昨日

    // 対象ユーザー
    const { data: users, error: userErr } = await supabase
        .from('daily_metrics')
        .select('user_id')
        .in('day', [targetDay, prevDay])

    if (userErr) {
        console.error(userErr)
        return Response.json({ ok: false }, { status: 500 })
    }

    const userIds = Array.from(new Set((users ?? []).map((u: any) => u.user_id)))
    const results: any[] = []

    // =========================
    // ★ ここから本体
    // =========================
    for (const userId of userIds) {

        // ① ユーザーのアラート設定取得
        const { data: settings } = await supabase
            .from('user_alert_settings')
            .select('alert_failed, alert_refunds, alert_late, email')
            .eq('user_id', userId)
            .maybeSingle()

        if (!settings || !settings.email) {
            results.push({ userId, skipped: 'no settings' })
            continue
        }

        const { data: rows, error } = await supabase
            .from('daily_metrics')
            .select('day, refunds_count, payment_failed_count, late_night_payments_count')
            .eq('user_id', userId)
            .in('day', [targetDay, prevDay])
            .order('day', { ascending: true })

        if (error) {
            results.push({ userId, error: error.message })
            continue
        }

        const t = (rows ?? []).find((r: any) => r.day === targetDay)
        const y = (rows ?? []).find((r: any) => r.day === prevDay)

        if (!t || !y) {
            results.push({ userId, skipped: 'missing day' })
            continue
        }

        const diffFailed = t.payment_failed_count - y.payment_failed_count
        const diffRefunds = t.refunds_count - y.refunds_count
        const diffLate = t.late_night_payments_count - y.late_night_payments_count

        const to = [settings.email]

        // =========================
        // 決済失敗（判断の参考）
        // =========================
        if (
            settings.alert_failed &&
            t.payment_failed_count > 0 &&
            diffFailed > 0
        ) {
            const title = '決済失敗の件数に変化が見られます'
            const body =
                '前日と比較して決済失敗の件数に変化があります。判断の参考としてご確認ください。'

            results.push(
                await sendOncePerDay({
                    userId,
                    type: 'failed',
                    to,
                    title,
                    body,
                    subject: '【DatLynq】決済失敗件数に変化が見られます',
                    html: `
        <h2>${title}</h2>
        <p>${body}</p>
        <p>
          昨日：${y.payment_failed_count}
          → 今日：${t.payment_failed_count}
        </p>
      `,
                })
            )
        }

        // =========================
        // 返金（判断の参考）
        // =========================
        if (
            settings.alert_refunds &&
            t.refunds_count > 0 &&
            diffRefunds > 0
        ) {
            const title = '返金の件数に変化が見られます'
            const body =
                '前日と比較して返金の件数に変化があります。判断の参考としてご確認ください。'

            results.push(
                await sendOncePerDay({
                    userId,
                    type: 'refunds',
                    to,
                    title,
                    body,
                    subject: '【DatLynq】返金件数に変化が見られます',
                    html: `
        <h2>${title}</h2>
        <p>${body}</p>
        <p>昨日：${y.refunds_count} → 今日：${t.refunds_count}</p>
      `,
                })
            )
        }

        // =========================
        // 深夜決済（判断の参考）
        // =========================
        if (
            settings.alert_late &&
            t.late_night_payments_count > 0 &&
            diffLate > 0
        ) {
            const title = '深夜時間帯の決済件数に変化が見られます'
            const body =
                '前日と比較して深夜時間帯の決済件数に変化があります。判断の参考としてご確認ください。'

            results.push(
                await sendOncePerDay({
                    userId,
                    type: 'late',
                    to,
                    title,
                    body,
                    subject: '【DatLynq】深夜時間帯の決済件数に変化が見られます',
                    html: `
        <h2>${title}</h2>
        <p>${body}</p>
        <p>
          昨日：${y.late_night_payments_count}
          → 今日：${t.late_night_payments_count}
        </p>
      `,
                })
            )
        }
    }

    return Response.json({ ok: true, checked: userIds.length, results })
}