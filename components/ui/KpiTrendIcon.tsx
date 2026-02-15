type KpiTrendIconType = 'ok' | 'warning' | 'danger'

type Props = {
  diff?: number
  alert?: boolean

  // ★ 追加
  type?: KpiTrendIconType
  size?: number
}

export default function KpiTrendIcon({
  diff,
  alert,
  type,
  size = 16,
}: Props) {
  const finalType: KpiTrendIconType =
    type ??
    (alert
      ? 'danger'
      : diff !== undefined && diff > 0
      ? 'warning'
      : 'ok')

  const iconSize = size

  switch (finalType) {
    case 'danger':
      return (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#dc2626"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      )

    case 'warning':
      return (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#92400e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 7h6v6" />
          <path d="m22 7-8.5 8.5-5-5L2 17" />
        </svg>
      )

    case 'ok':
    default:
      return (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#059669"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
  }
}