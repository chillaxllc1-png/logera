import Link from 'next/link'

export const metadata = {
  title: 'トップ',
}

export default function Page() {
  return (
    <section
      style={{
        maxWidth: 980,
        margin: '0 auto',
        padding: '48px 20px 72px',
        lineHeight: 1.7,
      }}
    >
      {/* HERO */}
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: 24,
          background: '#ffffff',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: '#374151',
            letterSpacing: 0.2,
          }}
        >
          高額・継続決済を扱う運営者向け
        </p>

        <h1 style={{ margin: '10px 0 8px', fontSize: 34, lineHeight: 1.2 }}>
          DatLynq（データリンク）
        </h1>

        <p
          style={{
            margin: '0 0 18px',
            fontSize: 18,
            color: '#111827',
          }}
        >
          日々の取引や決済に起きている
          <strong>「いつもと違う動き」</strong>を履歴として整理し、
          <br />
          運営者が判断するための<strong>材料を揃える</strong>業務支援ツールです。
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
          <Link
            href="/pricing"
            style={{
              display: 'inline-block',
              padding: '12px 16px',
              borderRadius: 10,
              background: '#111827',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            料金プランを見る
          </Link>

          <Link
            href="/signup"
            style={{
              display: 'inline-block',
              padding: '12px 16px',
              borderRadius: 10,
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #d1d5db',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            新規登録へ
          </Link>
        </div>

        <p style={{ margin: '16px 0 0', fontSize: 13, color: '#6b7280' }}>
          ※ 本サービスは、特定の行為や意図を判定・断定するものではありません。
          表示内容は、観測された履歴や比較情報に基づく判断支援のための参考情報です。
        </p>
      </div>

      {/* 利用シーン */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ margin: '0 0 10px', fontSize: 22 }}>
          このような運営で利用されています
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
          }}
        >
          <div style={cardStyle}>
            <p style={cardTitle}>高額決済が集中するデジタル販売</p>
            <p style={cardBody}>
              特定の日・時間帯に決済が集中する運営で、
              直近の動きが通常と比べてどう変化しているかを確認したい場合。
            </p>
          </div>

          <div style={cardStyle}>
            <p style={cardTitle}>オンラインスクール・継続課金サービス</p>
            <p style={cardBody}>
              申込・返金・継続状況を履歴として整理し、
              個別対応や判断の材料を揃えたい場合。
            </p>
          </div>

          <div style={cardStyle}>
            <p style={cardTitle}>会員制・サブスクリプション運営</p>
            <p style={cardBody}>
              通常時との違いや傾向の変化を、
              数値と履歴から把握しておきたい場合。
            </p>
          </div>
        </div>
      </div>

      {/* できること / できないこと */}
      <div
        style={{
          marginTop: 32,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        <div style={panelStyle}>
          <h2 style={{ margin: '0 0 10px', fontSize: 20 }}>できること</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>決済・返金・利用履歴の整理と一覧表示</li>
            <li>顧客単位・期間単位での履歴可視化</li>
            <li>通常時との比較による変化・傾向の把握（参考情報）</li>
          </ul>
        </div>

        <div style={panelStyle}>
          <h2 style={{ margin: '0 0 10px', fontSize: 20 }}>できないこと</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>不正の自動判定・強制的な処理実行</li>
            <li>返金可否や対応内容の自動決定</li>
          </ul>
        </div>
      </div>

      {/* 信頼・解約 */}
      <div style={{ marginTop: 26 }}>
        <p style={{ margin: 0, color: '#111827' }}>
          ご契約中は、管理画面からいつでも解約手続きを行うことができます。
        </p>
      </div>

      {/* 最終CTA */}
      <div
        style={{
          marginTop: 28,
          borderTop: '1px solid #e5e7eb',
          paddingTop: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <p style={{ margin: 0, color: '#374151' }}>
          判断材料を揃えるところから、無理なく始められます。
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link
            href="/pricing"
            style={{
              display: 'inline-block',
              padding: '10px 14px',
              borderRadius: 10,
              background: '#111827',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            料金プランを見る
          </Link>

          <Link
            href="/login"
            style={{
              display: 'inline-block',
              padding: '10px 14px',
              borderRadius: 10,
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #d1d5db',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            ログイン
          </Link>
        </div>
      </div>
    </section>
  )
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  padding: 16,
  background: '#ffffff',
}

const cardTitle: React.CSSProperties = {
  margin: 0,
  fontWeight: 800,
  color: '#111827',
}

const cardBody: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#374151',
}

const panelStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  padding: 18,
  background: '#ffffff',
}