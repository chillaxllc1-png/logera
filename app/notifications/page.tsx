'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { markAllAsRead } from '@/lib/notifications/markAllAsRead'

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Notification[]>([])

  useEffect(() => {
  if (!user?.id) return

  const supabase = getSupabaseBrowserClient()

  const run = async () => {
    setLoading(true)

    // ① まず既読化
    await markAllAsRead(user.id)

    // ② 既読化した状態で一覧を取り直す
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, body, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) setItems(data)

    setLoading(false)

    // ③ Header に即反映
    window.dispatchEvent(new Event('notifications:read'))
  }

  run()
}, [user?.id])

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24 }}>通知</h1>
        <Link href="/dashboard" style={{ textDecoration: 'underline', fontSize: 13 }}>
          ← 管理画面に戻る
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: 20, color: '#6b7280' }}>読み込み中…</div>
      ) : items.length === 0 ? (
        <div style={{ padding: 20, color: '#6b7280' }}>通知はまだありません。</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 16 }}>
          {items.map((n) => (
            <li
              key={n.id}
              style={{
                padding: '12px 14px',
                marginBottom: 10,
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                background: n.is_read ? '#ffffff' : '#fefce8',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 14 }}>{n.title}</div>

              {n.body && (
                <div style={{ marginTop: 4, fontSize: 13, color: '#374151' }}>
                  {n.body}
                </div>
              )}

              <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af' }}>
                {new Date(n.created_at).toLocaleString('ja-JP')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}