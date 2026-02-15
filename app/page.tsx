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
          高額デジタル販売・Webガチャ運営向け 分析支援SaaS
        </p>

        <h1 className="brand-title">
          <span className="brand-en">DatLynq</span>
          <span className="brand-ja">データリンク</span>
        </h1>

        <p
          style={{
            margin: '0 0 18px',
            fontSize: 18,
            color: '#111827',
          }}
        >
          Webガチャ・デジタルコンテンツ販売における
          <strong>注文・返金・決済履歴</strong>を横断的に整理し、
          運営判断に必要な「変化の兆し」を可視化します。
        </p>

        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginTop: 16,
          }}
        >
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

        <p
          style={{
            margin: '16px 0 0',
            fontSize: 13,
            color: '#6b7280',
          }}
        >
          ※ 本サービスは、不正行為の検知・断定を行うものではありません。
          あくまで過去データとの比較や傾向分析を通じて、
          運営者の判断を補助するための情報を提供します。
        </p>
      </div>

      {/* 課題 → 使いどころ */}
      <div style={{ marginTop: 28 }}>
        <h2 style={{ margin: '0 0 10px', fontSize: 22 }}>
          このような運営シーンで利用されています
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
          }}
        >
          <div style={cardStyle}>
            <p style={cardTitle}>高額決済が急増した日の確認</p>
            <p style={cardBody}>
              Webガチャや限定販売で決済件数が急増した際に、
              過去の傾向と比較して状況を把握したい場合。
            </p>
          </div>

          <div style={cardStyle}>
            <p style={cardTitle}>ユーザー単位の履歴把握</p>
            <p style={cardBody}>
              同一ユーザーによる連続購入・返金履歴を
              時系列でまとめて確認したい場合。
            </p>
          </div>

          <div style={cardStyle}>
            <p style={cardTitle}>日次・期間比較による傾向分析</p>
            <p style={cardBody}>
              昨日・先週・先月と比べて、
              決済や返金の動きに変化が出ていないかを確認したい場合。
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
          <h2 style={{ margin: '0 0 10px', fontSize: 20 }}>
            できること
          </h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>注文・返金・決済履歴の一元整理</li>
            <li>ユーザー単位・日次単位での傾向可視化</li>
            <li>「通常と異なる変化」の参考指標提示</li>
          </ul>
        </div>

        <div style={panelStyle}>
          <h2 style={{ margin: '0 0 10px', fontSize: 20 }}>
            できないこと
          </h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>不正行為の自動検知・断定</li>
            <li>返金・停止などの自動実行</li>
          </ul>
        </div>
      </div>

      {/* 解約明示 */}
      <div style={{ marginTop: 26 }}>
        <p style={{ margin: 0, color: '#111827' }}>
          ご契約中は、管理画面からいつでも解約手続きを行うことができます。
          長期契約や強制更新はありません。
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
          運営規模に応じた料金プランをご用意しています。
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

/* styles */

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