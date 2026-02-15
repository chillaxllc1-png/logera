'use client'

import { useState } from 'react'

export default function EnterpriseContact() {
    const [submitted, setSubmitted] = useState(false)

    if (submitted) {
        return (
            <section style={container}>
                <h1 style={title}>診断受付が完了しました</h1>

                <p style={{ color: '#374151', marginBottom: 16 }}>
                    通常<strong>24時間以内</strong>に専任担当よりご連絡いたします。
                </p>

                <div
                    style={{
                        padding: 20,
                        borderRadius: 14,
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        marginBottom: 24,
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>
                        🔍 今すぐ確認しておいてください
                    </div>

                    <ul style={{ paddingLeft: 20, margin: 0, color: '#374151' }}>
                        <li>直近7日の返金率</li>
                        <li>直近7日の決済失敗率</li>
                        <li>高額決済ユーザーの変動日</li>
                    </ul>
                </div>

                <div
                    style={{
                        padding: 20,
                        borderRadius: 14,
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        marginBottom: 24,
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>
                        ⚠ もし以下に該当する場合
                    </div>

                    <div style={{ fontSize: 14, color: '#374151' }}>
                        ・返金率が<strong>3％以上</strong><br />
                        ・日によって大きく上下している<br />
                        ・特定日の高額決済が急増している<br /><br />

                        → 構造的リスクが発生している可能性があります。
                    </div>
                </div>

                <div style={{ fontSize: 13, color: '#6b7280' }}>
                    担当者から具体的な分析視点をご案内いたします。
                </div>
            </section>
        )
    }

    return (
        <section style={container}>
            <h1 style={title}>
                構造的リスク診断 申し込み
            </h1>

            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
                現在の決済構造をヒアリングし、最適な分析設計をご提案します。
            </p>

            <form
                onSubmit={async (e) => {
                    e.preventDefault()

                    const formData = new FormData(e.currentTarget)

                    await fetch('/api/enterprise-contact', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            company: formData.get('company'),
                            name: formData.get('name'),
                            email: formData.get('email'),
                            scale: formData.get('scale'),
                            issue: formData.get('issue'),
                            message: formData.get('message'),
                        }),
                    })

                    setSubmitted(true)
                }}
                style={form}
            >

                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>月間決済規模</label>

                    <select name="scale" required style={inputStyle}>
                        <option value="">選択してください</option>
                        <option>〜500万円</option>
                        <option>500万〜1,000万円</option>
                        <option>1,000万〜5,000万円</option>
                        <option>5,000万円以上</option>
                    </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>現在最も懸念している課題</label>

                    <select name="issue" required style={inputStyle}>
                        <option value="">選択してください</option>
                        <option>返金率の上昇</option>
                        <option>高額ユーザーの挙動</option>
                        <option>決済失敗率の増加</option>
                        <option>原因が分からない変動</option>
                    </select>
                </div>

                <Input label="会社名 / サイト名" name="company" required />
                <Input label="担当者名" name="name" required />
                <Input label="メールアドレス" name="email" type="email" required />
                <Textarea label="現在の課題・相談内容" name="message" required />

                <button style={button}>
                    無料で構造診断を申し込む
                </button>

                <p style={{ marginTop: 12, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                    ※ 無理な営業は行いません。内容確認後、必要な場合のみご提案いたします。
                </p>
            </form>
        </section>
    )
}

/* ========================= */

function Input({
    label,
    name,
    type = 'text',
    required = false,
}: {
    label: string
    name: string
    type?: string
    required?: boolean
}) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{label}</label>
            <input
                name={name}
                type={type}
                required={required}
                style={inputStyle}
            />
        </div>
    )
}

function Textarea({
    label,
    name,
    required = false,
}: {
    label: string
    name: string
    required?: boolean
}) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{label}</label>
            <textarea
                name={name}
                required={required}
                rows={5}
                style={inputStyle}
            />
        </div>
    )
}

/* styles */

const container = {
    maxWidth: 620,
    margin: '0 auto',
    padding: '56px 20px 100px',
    lineHeight: 1.7,
}

const title = {
    fontSize: 28,
    marginBottom: 16,
}

const form = {
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 24,
    background: '#ffffff',
}

const labelStyle = {
    display: 'block',
    fontWeight: 700,
    marginBottom: 6,
    fontSize: 14,
}

const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 14,
}

const button = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 10,
    border: 'none',
    background: '#111827',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: 16,
    cursor: 'pointer',
}