import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  try {
    const data = await resend.emails.send({
      from: 'DatLynq Alert <alert@datlynq.com>',
      to: ['chillaxllc1@gmail.com'],
      subject: '【テスト】DatLynq アラート送信確認',
      html: `
        <h2>テスト成功 🎉</h2>
        <p>Resend + Cloudflare DNS + APIキーが正しく設定されています。</p>
        <p>このメールが届いていれば、<strong>本番アラート送信OK</strong>です。</p>
      `,
    })

    return Response.json({ success: true, data })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error })
  }
}