'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function LoginForm() {
    const router = useRouter()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (loading) return // 二重送信防止

        setError(null)
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        // ❌ 成功時は loading を戻さない
        // → 画面遷移でコンポーネントが破棄される

        if (error) {
            setLoading(false)
            setError('メールアドレスまたはパスワードが正しくありません')
            return
        }

        /**
         * ✅ 成功時にやることはこれだけ
         *
         * - session は Supabase が保存
         * - AuthContext が onAuthStateChange で検知
         * - localStorage / state は一切触らない
         */
        router.replace('/dashboard')
    }

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

            <form onSubmit={handleSubmit}>
                <div style={field}>
                    <label style={label}>メールアドレス</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@company.co.jp"
                        required
                        disabled={loading}
                    />
                </div>

                <div style={field}>
                    <label style={label}>パスワード</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                {error && (
                    <p
                        style={{
                            color: '#dc2626',
                            fontSize: 13,
                            marginBottom: 12,
                        }}
                    >
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    style={primaryButton}
                    disabled={loading}
                >
                    {loading ? 'ログイン中…' : 'ログインして管理画面へ'}
                </button>
            </form>

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