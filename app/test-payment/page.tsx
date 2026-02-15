'use client'

import { useState } from 'react'

export default function Page() {
    const [loading, setLoading] = useState(false)

    const handlePay = async () => {
        setLoading(true)

        try {
            const res = await fetch('/api/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'a4010e2c-da07-4087-8969-2476b661d188',
                    amount: 1000,
                }),
            })

            // 🔥 ① まずHTTPステータス確認
            if (!res.ok) {
                alert('現在決済は一時制限されています')
                return
            }

            const result = await res.json()

            // 🔥 ② JSON安全チェック
            if (!result?.allowed) {
                alert('現在決済は一時制限されています')
                return
            }

            alert('決済成功')

        } catch (err) {
            console.error('payment error:', err)
            alert('通信エラーが発生しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ padding: 40 }}>
            <h1>テスト決済</h1>

            <button
                onClick={handlePay}
                disabled={loading}
                style={{
                    padding: 12,
                    background: '#111',
                    color: '#fff',
                    borderRadius: 8,
                }}
            >
                {loading ? '処理中...' : '1000円決済'}
            </button>
        </div>
    )
}