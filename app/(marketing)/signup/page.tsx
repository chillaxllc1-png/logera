'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function Signup() {
    const router = useRouter()

    const [company, setCompany] = useState('')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (loading) return

        setLoading(true)
        setError(null)

        const supabase = getSupabaseBrowserClient()

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { company, name },
            },
        })

        setLoading(false)

        if (error) {
            setError(error.message)
            return
        }

        // ✅ session がある（＝メール確認なし等）→ そのまま Billing へ
        if (data?.session) {
            router.replace('/billing')
            return
        }

        // ✅ session が無い（＝メール確認が必要な設定の可能性）→ 案内ページへ
        router.replace('/login?from=signup')
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
                DatLynq を利用するためのアカウントを作成します。
                <br />
                登録後、プラン内容を確認し、
                利用開始のためのお支払い手続きに進みます。
            </p>

            <form onSubmit={handleSubmit}>
                <div style={field}>
                    <label style={label}>会社名</label>
                    <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div style={field}>
                    <label style={label}>担当者名</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div style={field}>
                    <label style={label}>メールアドレス</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        minLength={8}
                        required
                        disabled={loading}
                    />
                </div>

                {error && (
                    <p style={{ color: '#dc2626', fontSize: 13 }}>
                        {error}
                    </p>
                )}

                <button type="submit" style={primaryButton} disabled={loading}>
                    {loading ? '登録中…' : 'アカウントを作成して利用開始へ進む'}
                </button>
            </form>

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