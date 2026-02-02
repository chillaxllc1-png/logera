// app/checkout/CheckoutClient.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createOrUpdateSubscription } from '@/lib/supabase/subscriptions.ts'
import { useAuth } from '@/lib/auth/AuthContext.tsx'
import { getSupabaseBrowserClient } from '@/lib/supabase/client.ts'

export default function CheckoutClient() {
    const router = useRouter()
    const { user, refreshSubscription } = useAuth()

    const searchParams = useSearchParams()
    const upgradePlan = searchParams.get('upgrade') as
        | 'growth'
        | 'pro'
        | null

    const [isCompleted, setIsCompleted] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handlePayment = async () => {
        setError(null)

        if (!user) {
            setError('ログイン状態を確認できませんでした。再ログインしてください。')
            return
        }

        try {
            setIsSaving(true)

            const supabase = getSupabaseBrowserClient()
            const targetPlanKey = upgradePlan ?? 'starter'

            const { data: plan, error: planError } = await supabase
                .from('plans')
                .select('id, name, price_yen')
                .eq('key', targetPlanKey)
                .single()

            if (planError || !plan) {
                throw new Error('プラン情報を取得できませんでした')
            }

            await createOrUpdateSubscription({
                userId: user.id,
                planId: plan.id,
            })

            await refreshSubscription()

            setIsCompleted(true)
            sessionStorage.setItem('datlynq:fromCheckout', 'true')

            setTimeout(() => {
                router.replace('/dashboard')
            }, 1500)
        } catch (e) {
            console.error(e)
            setError(
                'お支払いを完了できませんでした。通信状況をご確認のうえ、もう一度お試しください。'
            )
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        sessionStorage.setItem('datlynq:checkoutCanceled', 'true')
        router.replace('/billing')
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

                    <p
                        style={{
                            margin: '0 0 12px',
                            color: '#166534',
                            fontWeight: 700,
                        }}
                    >
                        {upgradePlan
                            ? 'プラン変更が完了しました'
                            : 'Starter プランが有効化されました'}
                    </p>

                    <p style={{ margin: 0, color: '#166534' }}>
                        管理画面へ移動します…
                    </p>
                </div>
            ) : (
                <>
                    <h1 style={{ margin: '0 0 12px', fontSize: 28 }}>
                        {upgradePlan ? 'プラン変更の確認' : 'お支払い手続き'}
                    </h1>

                    <p style={{ margin: '0 0 24px', color: '#374151' }}>
                        {upgradePlan
                            ? '現在のプランから上位プランへ変更します。確定後、すぐにすべての機能が利用可能になります。'
                            : '以下の内容でお支払いを行います。決済完了後、すぐに管理画面をご利用いただけます。'}
                    </p>

                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
                        ※ プランは後からいつでも変更・解約できます。
                    </p>

                    <div
                        style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: 16,
                            padding: 20,
                            background: '#ffffff',
                            marginBottom: 16,
                        }}
                    >
                        <dl style={{ margin: 0 }}>
                            <div style={row}>
                                <dt style={dt}>プラン</dt>
                                <dd style={dd}>
                                    {upgradePlan
                                        ? `${upgradePlan.toUpperCase()}（アップグレード）`
                                        : 'Starter（後からいつでも上位プランへ変更できます）'}
                                </dd>
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

                    {upgradePlan && (
                        <p
                            style={{
                                margin: '0 0 16px',
                                fontSize: 13,
                                color: '#065f46',
                                fontWeight: 600,
                            }}
                        >
                            ※ アップグレード後、追加料金は発生しません。
                            <br />
                            次回更新日から新プランの料金が適用されます。
                        </p>
                    )}

                    {error && (
                        <div
                            style={{
                                margin: '0 0 16px',
                                padding: '12px 14px',
                                borderRadius: 12,
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#991b1b',
                                fontSize: 14,
                                fontWeight: 700,
                            }}
                        >
                            {error}
                            <div
                                style={{
                                    marginTop: 6,
                                    fontSize: 12,
                                    fontWeight: 600,
                                }}
                            >
                                ※ 内容を修正後、もう一度お支払いをお試しください。
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handlePayment}
                        style={payButton}
                        disabled={isSaving}
                    >
                        {isSaving
                            ? '処理中…'
                            : error
                                ? 'もう一度実行する'
                                : upgradePlan
                                    ? '内容を確認してアップグレード'
                                    : '内容を確認して支払う'}
                    </button>

                    <button
                        type="button"
                        onClick={handleCancel}
                        style={{
                            marginTop: 12,
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: '1px solid #d1d5db',
                            background: '#ffffff',
                            color: '#374151',
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                        disabled={isSaving}
                    >
                        キャンセルして戻る
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