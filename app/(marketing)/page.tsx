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
          法人向け業務支援SaaS
        </p>

        <h1 style={{ margin: '10px 0 8px', fontSize: 34, lineHeight: 1.2 }}>
          Logera（ロゲラ）
        </h1>

        <p style={{ margin: '0 0 18px', fontSize: 18, color: '#111827' }}>
          注文・返金対応に関する履歴を整理・可視化し、担当者が判断するための参考情報を提供します。
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

          <Link
            href="/cancel"
            style={{
              display: 'inline-block',
              padding: '12px 16px',
              borderRadius: 10,
              background: '#ffffff',
              color: '#374151',
              border: '1px solid #e5e7eb',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            解約方法を確認
          </Link>
        </div>

        <p style={{ margin: '16px 0 0', fontSize: 13, color: '#6b7280' }}>
          ※ 本サービスは、不正の有無や特定の意図を判定・断定するものではありません。表示内容は観測された履歴や比較情報に基づく参考情報です。
        </p>
      </div>

      {/* 課題 → 使いどころ */}
      <div style={{ marginTop: 28 }}>
        <h2 style={{ margin: '0 0 10px', fontSize: 22 }}>このような業務で利用されています</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
          }}
        >
          <div style={cardStyle}>
            <p style={cardTitle}>対応履歴の確認</p>
            <p style={cardBody}>
              返金依頼が増えた月に、過去の対応履歴をまとめて確認したい場合。
            </p>
          </div>
          <div style={cardStyle}>
            <p style={cardTitle}>顧客単位の時系列</p>
            <p style={cardBody}>
              同一顧客の注文・返金履歴を、時系列で一覧したい場合。
            </p>
          </div>
          <div style={cardStyle}>
            <p style={cardTitle}>傾向の把握</p>
            <p style={cardBody}>
              直近の対応状況が、過去と比べてどのような傾向にあるかを確認したい場合。
            </p>
          </div>
        </div>
      </div>

      {/* できること / できないこと */}
      <div
        style={{
          marginTop: 30,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        <div style={panelStyle}>
          <h2 style={{ margin: '0 0 10px', fontSize: 20 }}>できること</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>注文・返金履歴の整理</li>
            <li>顧客単位の履歴の可視化</li>
            <li>「通常と異なる傾向（参考）」の要因表示（根拠付き）</li>
          </ul>
        </div>

        <div style={panelStyle}>
          <h2 style={{ margin: '0 0 10px', fontSize: 20 }}>できないこと</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>不正の判定・断定</li>
            <li>出荷停止や返金可否の自動判断</li>
          </ul>
        </div>
      </div>

      {/* 解約明示（審査・信頼） */}
      <div style={{ marginTop: 26 }}>
        <p style={{ margin: 0, color: '#111827' }}>
          ご契約中は、管理画面からいつでも解約手続きを行うことができます（解約後の扱いは「解約方法」ページをご参照ください）。
        </p>
      </div>

      {/* 最終CTA */}
      <div
        style={{
          marginTop: 26,
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
          料金・契約条件を確認してから始められます。
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