import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
)

export async function POST(req: Request) {
  try {
    const { type, subject, message, userId } = await req.json()

    if (!type || !userId) {
      return Response.json({ success: false }, { status: 400 })
    }

    const today = new Date().toISOString().slice(0, 10)

    // ① まず INSERT（ここが1日1回ガード）
    const { error } = await supabase.from('alert_logs').insert({
      user_id: userId,
      alert_type: type,
      alert_date: today, // ← テーブル定義に合わせる
    })

    // ② すでに送信済みなら終了
    if (error) {
      return Response.json({ skipped: true })
    }

    // ③ 初回だけメール送信
    await resend.emails.send({
      from: 'DatLynq Alerts <alert@datlynq.com>',
      to: ['chillaxllc1@gmail.com'],
      subject,
      html: `
        <h2>${subject}</h2>
        <p>${message}</p>
        <p style="color:#6b7280;font-size:12px">
          DatLynq 自動アラート
        </p>
      `,
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error(err)
    return Response.json({ success: false }, { status: 500 })
  }
}