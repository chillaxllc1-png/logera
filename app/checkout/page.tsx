'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'

export const metadata = {
    title: 'お支払い｜Logera',
}

export default function Checkout() {
    const router = useRouter()
    const { activateSubscription } = useAuth()

    const [isCompleted, setIsCompleted] = useState(false)

    const handlePayment = () => {
        // 仮：pay.jp 決済成功
        activateSubscription()

        // 完了演出を表示
        setIsCompleted(true)

        // 1秒後に dashboard へ
        setTimeout(() => {
            router.replace('/dashboard')
        }, 1000)
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
            {/* 完了メッセージ */}
            {isCompleted ? (
                <div
                    style={{
                        border: '1px solid #86efac',
                        background: '#f0fdf4',
                        borderRadius: 16,
                        padding: 24,
                        textAlign: 'center',
                    }}
                >
                    <h1 style={{ margin: '0 0 12px', fontSize: 26 }}>
                        お支払いが完了しました
                    </h1>

                    <p style={{ margin: 0, color: '#166534' }}>
                        ご利用ありがとうございます。
                        <br />
                        管理画面へ移動します…
                    </p>
                </div>
            ) : (
                <>
                    <h1 style={{ margin: '0 0 12px', fontSize: 28 }}>
                        お支払い手続き
                    </h1>

                    <p style={{ margin: '0 0 24px', color: '#374151' }}>
                        以下の内容でお支払いを行います。
                        決済完了後、すぐに管理画面をご利用いただけます。
                    </p>

                    <div
                        style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: 16,
                            padding: 20,
                            background: '#ffffff',
                            marginBottom: 24,
                        }}
                    >
                        <dl style={{ margin: 0 }}>
                            <div style={row}>
                                <dt style={dt}>プラン</dt>
                                <dd style={dd}>Starter</dd>
                            </div>
                            <div style={row}>
                                <dt style={dt}>月額料金</dt>
                                <dd style={dd}>19,800円（税込）</dd>
                            </div>
                            <div style={row}>
                                <dt style={dt}>課金開始</dt>
                                <dd style={dd}>本日</dd>
                            </div>
                        </dl>
                    </div>

                    <button onClick={handlePayment} style={payButton}>
                        クレジットカードで支払う（pay.jp ダミー）
                    </button>

                    <p style={{ marginTop: 16, fontSize: 13, color: '#6b7280' }}>
                        ※ 現在はテスト画面です。実際の決済は発生しません。
                    </p>
                </>
            )}
        </section>
    )
}

/* styles */

const row: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
}

const dt: React.CSSProperties = {
    fontWeight: 600,
    color: '#374151',
}

const dd: React.CSSProperties = {
    margin: 0,
    color: '#111827',
}

const payButton: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 10,
    border: 'none',
    background: '#111827',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
}