// src/components/dashboard/AdvancedComparisonCard.tsx
'use client'

type Props = {
  label: string
  today: number
  avg: number
  danger?: boolean
}

export default function AdvancedComparisonCard({
  label,
  today,
  avg,
  danger,
}: Props) {
  const diff = today - avg

  const diffColor =
    diff > 0
      ? danger
        ? '#dc2626'
        : '#059669'
      : diff < 0
        ? '#2563eb'
        : '#6b7280'

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 14,
        border: '1px solid #e5e7eb',
        background: '#ffffff',
      }}
    >
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>

      <div style={{ fontSize: 14, marginTop: 6 }}>
        本日：<strong>{today}</strong> 件
      </div>

      <div style={{ fontSize: 13, color: '#6b7280' }}>
        7日平均：{avg} 件
      </div>

      <div
        style={{
          marginTop: 6,
          fontWeight: 700,
          color: diffColor,
        }}
      >
        差分：{diff > 0 ? `+${diff}` : diff}
      </div>
    </div>
  )
}