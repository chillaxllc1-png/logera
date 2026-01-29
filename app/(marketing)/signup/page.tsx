'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Signup() {
    const router = useRouter()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // ※ 将来ここで API / 認証処理を入れる
        // 今は導線を確定させるのが最優先
        router.push('/billing')
    }

    return (
        <section
            style={{
                maxWidth: 520,
                margin: '0 auto',
                padding: '56px 20px 80px',
            }}
        >
            <h1 style={{ margin: '0 0 12px', fontSize: 28 }}>
                新規登録
            </h1>

            <p style={{ margin: '0 0 28px', color: '#374151', lineHeight: 1.6 }}>
                会社情報と担当者情報を入力し、DatLynq のアカウントを作成します。
                <br />
                登録後、料金プランの確認とお支払い手続きに進みます。
            </p>

            {/* 安心補足 */}
            <div
                style={{
                    marginBottom: 24,
                    padding: 14,
                    borderRadius: 12,
                    background: '#f9fafb',
                    fontSize: 13,
                    color: '#374151',
                    lineHeight: 1.6,
                }}
            >
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>本サービスは法人・事業者向けサービスです</li>
                    <li>登録時点では料金は発生しません</li>
                    <li>クレジットカード情報の入力は登録後に行います</li>
                    <li>契約後も管理画面からいつでも解約できます</li>
                </ul>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={field}>
                    <label style={label}>会社名</label>
                    <input
                        type="text"
                        placeholder="例：株式会社サンプル"
                        required
                    />
                </div>

                <div style={field}>
                    <label style={label}>担当者名</label>
                    <input
                        type="text"
                        placeholder="例：山田 太郎"
                        required
                    />
                </div>

                <div style={field}>
                    <label style={label}>メールアドレス</label>
                    <input
                        type="email"
                        placeholder="example@company.co.jp"
                        required
                    />
                </div>

                <div style={field}>
                    <label style={label}>パスワード</label>
                    <input
                        type="password"
                        placeholder="8文字以上"
                        minLength={8}
                        required
                    />
                </div>

                <p style={{ fontSize: 14, color: '#374151', marginBottom: 12 }}>
                    アカウント作成後、管理画面にて料金プランを選択し、
                    お支払い手続きを行うことで正式に利用が開始されます。
                    登録時点では料金は発生しません。
                </p>

                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8, marginBottom: 16 }}>
                    ※ 支払い手続き完了後、すぐに管理画面をご利用いただけます。
                </p>

                <button type="submit" style={primaryButton}>
                    アカウントを作成して支払いへ進む
                </button>
            </form>

            <p
                style={{
                    marginTop: 16,
                    fontSize: 13,
                    color: '#6b7280',
                    lineHeight: 1.6,
                }}
            >
                登録することで、
                <Link href="/terms"> 利用規約</Link> および
                <Link href="/privacy"> プライバシーポリシー</Link>
                に同意したものとみなされます。
            </p>

            <div style={{ marginTop: 28 }}>
                <p style={{ margin: 0, fontSize: 14 }}>
                    すでにアカウントをお持ちの場合は
                    <Link href="/login"> ログイン</Link>
                    してください。
                </p>
            </div>
        </section>
    )
}

/* styles */

const field: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 16,
}

const label: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
}

const primaryButton: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: 'none',
    background: '#111827',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
}