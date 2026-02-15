// app/checkout/CheckoutClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createOrUpdateSubscription } from '@/lib/supabase/subscriptions'
import { useAuth } from '@/lib/auth/AuthContext'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function CheckoutClient() {
    const router = useRouter()
    const { user, refreshSubscription } = useAuth()

    const searchParams = useSearchParams()
    const upgradePlan = searchParams.get('upgrade') as
        | 'growth'
        | 'pro'
        | null

    const PLAN_PRICES: Record<'starter' | 'growth' | 'pro', string> = {
        starter: '29,800円（税込）',
        growth: '69,800円（税込）',
        pro: '149,800円（税込）',
    }

    const selectedPlan: 'starter' | 'growth' | 'pro' =
        upgradePlan ?? 'starter'
    const selectedPrice = PLAN_PRICES[selectedPlan]

    const [isCompleted, setIsCompleted] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [isRestricted, setIsRestricted] = useState(false)

    useEffect(() => {
        if (!user) return

        const checkRisk = async () => {
            const supabase = getSupabaseBrowserClient()
            const { data } = await supabase
                .from('risk_controls')
                .select('status')
                .eq('user_id', user.id)
                .maybeSingle()

            setIsRestricted(data?.status === 'restricted')
        }

        checkRisk()
    }, [user])

    const handlePayment = async () => {
        setError(null)

        if (!user) {
            setError('ログイン状態を確認できませんでした。再ログインしてください。')
            return
        }

        try {
            setIsSaving(true)

            const targetPlanKey = upgradePlan ?? 'starter'

            await createOrUpdateSubscription({
                userId: user.id,
                planKey: targetPlanKey, // ✅ ここが唯一の正解
            })

            await refreshSubscription()

            setIsCompleted(true)
            sessionStorage.setItem('datlynq:fromCheckout', 'true')

            setTimeout(() => {
                router.replace('/dashboard')
            }, 1500)
        } catch (e: any) {
            console.error(e)

            if (e?.message === 'account_restricted') {
                setError(
                    'このアカウントは現在、リスク検知により一時的に制限モードになっています。解除後にプラン変更が可能になります。'
                )
                return
            }

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
            {isRestricted && (
                <div
                    style={{
                        marginBottom: 20,
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        color: '#9a3412',
                        fontWeight: 700,
                        fontSize: 14,
                        lineHeight: 1.6,
                    }}
                >
                    🟠 このアカウントは現在 <strong>制限モード</strong> です
                    <br />
                    リスク検知により、一時的にプラン変更・契約操作が制限されています。
                </div>
            )}

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
                        {upgradePlan ? 'プラン変更の確認' : 'プラン選択・利用開始'}
                    </h1>

                    <p style={{ margin: '0 0 24px', color: '#374151' }}>
                        {upgradePlan
                            ? '選択した上位プランの内容を確認し、変更を確定します。確定後、すぐに管理画面の機能が利用可能になります。'
                            : '選択したプランの内容を確認し、支払いを確定します。確定後、すぐに管理画面の機能が利用可能になります。'}
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
                                    {selectedPlan.toUpperCase()}
                                </dd>
                            </div>
                            <div style={row}>
                                <dt style={dt}>月額料金</dt>
                                <dd style={dd}>{selectedPrice}</dd>
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
                        disabled={isSaving || isRestricted}
                    >
                        {isSaving
                            ? '処理中…'
                            : error
                                ? 'もう一度実行する'
                                : upgradePlan
                                    ? '内容を確認してアップグレード'
                                    : '内容を確認して利用を開始'}
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