'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AlertSettings from './tabs/AlertSettings'

type SettingsTab = 'notifications' | 'security' | 'future'

export default function SettingsContent() {
  const params = useSearchParams()
  const tab = (params.get('tab') as SettingsTab) ?? 'notifications'

  return (
    <section style={{ maxWidth: 760, margin: '0 auto', padding: '56px 20px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>設定</h1>

      {/* タブ */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <TabButton label="通知" active={tab === 'notifications'} href="?tab=notifications" />
        <TabButton label="セキュリティ" active={tab === 'security'} href="?tab=security" />
        <TabButton label="将来拡張" active={tab === 'future'} href="?tab=future" />
      </div>

      {/* 中身 */}
      {tab === 'notifications' && <AlertSettings />}
      {tab === 'security' && <Placeholder title="セキュリティ設定（準備中）" />}
      {tab === 'future' && <Placeholder title="将来拡張（準備中）" />}
    </section>
  )
}

function TabButton({
  label,
  active,
  href,
}: {
  label: string
  active: boolean
  href: string
}) {
  return (
    <Link
      href={href}
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 700,
        textDecoration: 'none',
        border: '1px solid #e5e7eb',
        background: active ? '#111827' : '#ffffff',
        color: active ? '#ffffff' : '#111827',
      }}
    >
      {label}
    </Link>
  )
}

function Placeholder({ title }: { title: string }) {
  return (
    <div
      style={{
        padding: 24,
        borderRadius: 16,
        border: '1px dashed #e5e7eb',
        color: '#6b7280',
      }}
    >
      {title}
    </div>
  )
}