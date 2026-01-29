import Link from 'next/link'

export const metadata = {
    title: 'ログイン｜DatLynq',
    description:
        '法人向け業務支援SaaS「DatLynq」のログインページです。ログイン後は管理画面へ遷移します。',
}

export default function Login() {
    return (
        <section
            style={{
                maxWidth: 520,
                margin: '0 auto',
                padding: '56px 20px 80px',
                lineHeight: 1.7,
            }}
        >
            <h1 style={{ margin: '0 0 12px', fontSize: 28 }}>
                ログイン
            </h1>

            <p style={{ margin: '0 0 24px', color: '#374151' }}>
                登録済みのメールアドレスとパスワードを入力し、
                管理画面へログインしてください。
            </p>

            {/* 補足・安心表示 */}
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
                    <li>ログイン後は管理画面へ遷移します</li>
                    <li>本サービスは法人・事業者向けサービスです</li>
                </ul>
            </div>

            <form>
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
                        required
                    />
                </div>

                <button type="submit" style={primaryButton}>
                    ログインして管理画面へ
                </button>
            </form>

            {/* 未実装注記 */}
            <p style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
                ※ 現在は画面イメージのみです。認証機能は順次実装予定です。
            </p>

            <div style={{ marginTop: 28 }}>
                <p style={{ margin: 0, fontSize: 14 }}>
                    アカウントをお持ちでない場合は
                    <Link href="/signup"> 新規登録</Link>
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