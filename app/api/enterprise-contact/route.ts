import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // =========================
    // ① 管理側へ通知
    // =========================
    await resend.emails.send({
      from: 'alerts@datlynq.com',
      to: ['support@datlynq.com'],
      replyTo: body.email,
      subject: '【Enterprise診断申込】新規問い合わせ',
      html: `
        <h2>Enterprise診断申込</h2>
        <p><strong>会社名：</strong>${body.company}</p>
        <p><strong>担当者名：</strong>${body.name}</p>
        <p><strong>メール：</strong>${body.email}</p>
        <p><strong>月間決済規模：</strong>${body.scale}</p>
        <p><strong>課題：</strong>${body.issue}</p>
        <p><strong>詳細：</strong>${body.message}</p>
      `,
    })

    // =========================
    // ② 申込者へ自動返信
    // =========================
    await resend.emails.send({
      from: 'support@datlynq.com',
      to: [body.email],
      subject: '【DatLynq】構造的リスク診断を受付しました',
      html: `
        <h2>診断受付が完了しました</h2>
        <p>この度はお申し込みありがとうございます。</p>

        <p>
        通常<strong>24時間以内</strong>に専任担当よりご連絡いたします。
        </p>

        <hr />

        <p><strong>今すぐできること：</strong></p>
        <ul>
          <li>直近7日の返金率を確認してください</li>
          <li>高額決済ユーザーの変動日をメモしてください</li>
        </ul>

        <p style="margin-top:20px;">
        DatLynq サポートチーム
        </p>
      `,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    )

  } catch (error) {
    console.error(error)

    return new Response(
      JSON.stringify({ success: false }),
      { status: 500 }
    )
  }
}