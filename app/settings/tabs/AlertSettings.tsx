'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import KpiTrendIcon from '@/components/ui/KpiTrendIcon'

type AlertSettings = {
    user_id: string
    alert_failed: boolean
    alert_refunds: boolean
    alert_late: boolean
    email: string | null
}

export default function AlertSettings() {
    const { user } = useAuth()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [savedMsg, setSavedMsg] = useState<string | null>(null)

    const [form, setForm] = useState<AlertSettings | null>(null)

    useEffect(() => {
        if (!user) return

        const load = async () => {
            setLoading(true)
            setError(null)
            setSavedMsg(null)

            const supabase = getSupabaseBrowserClient()

            const { data, error } = await supabase
                .from('user_alert_settings')
                .select('user_id, alert_failed, alert_refunds, alert_late, email')
                .eq('user_id', user.id)
                .maybeSingle<AlertSettings>()

            if (error) {
                setError(error.message)
                setLoading(false)
                return
            }

            // 行がなければ “初期値で作る（upsertでOK）”
            const initial: AlertSettings = data ?? {
                user_id: user.id,
                alert_failed: true,
                alert_refunds: true,
                alert_late: true,
                email: user.email ?? null,
            }

            setForm(initial)
            setLoading(false)
        }

        load()
    }, [user])

    const onSave = async () => {
        if (!user || !form) return

        setSaving(true)
        setError(null)
        setSavedMsg(null)

        const supabase = getSupabaseBrowserClient()

        const { error } = await supabase
            .from('user_alert_settings')
            .upsert(
                {
                    user_id: user.id,
                    alert_failed: form.alert_failed,
                    alert_refunds: form.alert_refunds,
                    alert_late: form.alert_late,
                    email: form.email,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
            )

        if (error) {
            setError(error.message)
            setSaving(false)
            return
        }

        setSavedMsg('保存しました')
        setSaving(false)
    }

    if (!user) {
        return (
            <section style={{ padding: 40 }}>
                <p>ログインしてください。</p>
                <Link href="/login" style={{ textDecoration: 'underline' }}>
                    ログインへ
                </Link>
            </section>
        )
    }

    return (
        <section style={{ maxWidth: 720, margin: '0 auto', padding: '56px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <h1 style={{ fontSize: 24, margin: 0 }}>通知設定</h1>
                <Link href="/dashboard" style={{ textDecoration: 'underline', fontSize: 13 }}>
                    ← 管理画面に戻る
                </Link>
            </div>

            <p style={{ marginTop: 10, color: '#6b7280', fontSize: 13, lineHeight: 1.6 }}>
                アラートが発生したときに送るメールと、通知のON/OFFを設定できます。
            </p>

            <div
                style={{
                    marginTop: 16,
                    padding: 16,
                    borderRadius: 16,
                    border: '1px solid #e5e7eb',
                    background: '#ffffff',
                }}
            >
                {loading ? (
                    <div style={{ padding: 12 }}>読み込み中…</div>
                ) : !form ? (
                    <div style={{ padding: 12, color: '#991b1b' }}>データを読み込めませんでした</div>
                ) : (
                    <>
                        {/* メール */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#111827' }}>
                                通知先メールアドレス
                            </div>
                            <input
                                value={form.email ?? ''}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="例）you@example.com"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: 12,
                                    border: '1px solid #e5e7eb',
                                    fontSize: 14,
                                }}
                            />
                            <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                                ここに設定したアドレスにアラートを送ります。
                            </div>
                        </div>

                        {/* トグル */}
                        <div style={{ display: 'grid', gap: 10 }}>
                            <ToggleRow
                                iconType="danger"
                                label="決済失敗（危険）"
                                checked={form.alert_failed}
                                onChange={(v) => setForm({ ...form, alert_failed: v })}
                                desc="前日より増えた場合に通知（最優先）"
                            />

                            <ToggleRow
                                iconType="warning"
                                label="返金（注意）"
                                checked={form.alert_refunds}
                                onChange={(v) => setForm({ ...form, alert_refunds: v })}
                                desc="返金が前日より増えた場合に通知"
                            />

                            <ToggleRow
                                iconType="warning"
                                label="深夜決済（注意）"
                                checked={form.alert_late}
                                onChange={(v) => setForm({ ...form, alert_late: v })}
                                desc="深夜決済が前日より増えた場合に通知"
                            />
                        </div>

                        {/* ボタン */}
                        <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                            <button
                                onClick={onSave}
                                disabled={saving}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: 12,
                                    border: '1px solid #111827',
                                    background: '#111827',
                                    color: '#ffffff',
                                    fontWeight: 800,
                                    fontSize: 13,
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {saving ? '保存中…' : '保存'}
                            </button>

                            {savedMsg && (
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{savedMsg}</div>
                            )}
                            {error && (
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>エラー: {error}</div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </section>
    )
}

function ToggleRow({
    iconType,
    label,
    checked,
    onChange,
    desc,
}: {
    iconType: 'danger' | 'warning' | 'ok'
    label: string
    checked: boolean
    onChange: (v: boolean) => void
    desc?: string
}) {
    const titleColor =
        iconType === 'danger' ? '#991b1b' : iconType === 'warning' ? '#92400e' : '#065f46'

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 14,
                background: '#fff',
            }}
        >
            <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <KpiTrendIcon type={iconType} size={16} />
                    <div style={{ fontSize: 13, fontWeight: 800, color: titleColor }}>
                        {label}
                    </div>
                </div>

                {desc ? (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
                        {desc}
                    </div>
                ) : null}
            </div>

            <Switch checked={checked} onChange={onChange} />
        </div>
    )
}

function Switch({
    checked,
    onChange,
}: {
    checked: boolean
    onChange: (v: boolean) => void
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            style={{
                width: 46,
                height: 28,
                borderRadius: 999,
                border: '1px solid',
                borderColor: checked ? '#10b981' : '#e5e7eb',
                background: checked ? '#10b981' : '#e5e7eb',
                padding: 2,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: checked ? 'flex-end' : 'flex-start',
                transition: 'all 150ms ease',
                boxShadow: checked ? '0 0 0 3px rgba(16,185,129,0.15)' : 'none',
            }}
        >
            <span
                style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    background: '#ffffff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
                    transition: 'all 150ms ease',
                }}
            />
        </button>
    )
}

