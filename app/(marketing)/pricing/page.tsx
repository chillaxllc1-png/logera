import React from 'react'
import Link from 'next/link'

export const metadata = {
  title: '料金プラン',
}

export default function Pricing() {
  return (
    <section
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '56px 20px 88px',
        lineHeight: 1.7,
      }}
    >
      {/* ヘッダー */}
      <div style={{ marginBottom: 34 }}>
        <h1 style={{ margin: '0 0 14px', fontSize: 34 }}>料金プラン</h1>

        <p style={{ margin: 0, color: '#374151', fontSize: 16 }}>
          DatLynq は、
          <strong>
            高額デジタル決済を扱う運営のための「リスク兆候の可視化と制御判断支援」SaaS
          </strong>
          です。
          <br />
          異常兆候の検知から、運営ポリシーに基づく制御判断までを一貫して支援します。
        </p>

        {/* 価値の芯（短く） */}
        <div
          style={{
            marginTop: 14,
            padding: '12px 14px',
            borderRadius: 14,
            border: '1px solid #e5e7eb',
            background: '#f9fafb',
            color: '#374151',
            fontSize: 13,
          }}
        >
          ✅ 無料・トライアルは行いません（価値提供に集中するため）。
          <br />
          ✅ すべてのプランで「判断の根拠」を積み上げ、上位プランほど「制御判断の実行」に近づきます。
        </div>
      </div>

      {/* プラン一覧（売れる順：Growth → Starter → Pro → Enterprise） */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
          alignItems: 'stretch',
        }}
      >
        {/* Growth（主力） */}
        <div style={{ ...planCard, ...growthHighlight }}>
          <div style={popularBadge}>最も選ばれています</div>

          <h3 style={planTitle}>Growth</h3>
          <p style={planPrice}>月額 69,800円（税込）</p>

          <p style={planDesc}>
            異常兆候を「早く」「根拠つき」で捉える主力プラン
          </p>

          <ul style={planList}>
            <li>過去データとの比較分析（直近7日・30日など）</li>
            <li>通常時との差分可視化（増減・変動の把握）</li>
            <li>リスク傾向の推移表示（変化の兆候を追う）</li>
          </ul>

          <div style={planNote}>
            「いつもと違う」を感覚ではなく、<strong>データで判断</strong>したい運営に。
            <br />
            ※ 本プランは制御機能（自動調整）は含みません。
          </div>

          <Link href="/signup" style={planCtaPrimary}>
            Growthを選択する
          </Link>

          <div style={subCtaNote}>
            迷ったら Growth。まず「検知と比較」を完成させるのが最短です。
          </div>
        </div>

        {/* Starter */}
        <div style={planCard}>
          <h3 style={planTitle}>Starter</h3>
          <p style={planPrice}>月額 29,800円（税込）</p>

          <p style={planDesc}>取引状況の「把握」と「整理」を固める基盤プラン</p>

          <ul style={planList}>
            <li>注文・返金履歴の一覧管理</li>
            <li>ユーザー単位の履歴確認（時系列で把握）</li>
            <li>基本的なKPI表示（現状把握）</li>
          </ul>

          <div style={planNote}>
            まず全体像を見える化し、判断の土台を作りたい運営に。
          </div>

          <Link href="/signup" style={planCtaSecondary}>
            利用を開始する
          </Link>

          <div style={subCtaNote}>
            すでに取引量があり「比較」が必要なら Growth が最適です。
          </div>
        </div>

        {/* Pro */}
        <div style={planCard}>
          <div style={proBadge}>判断ミスを減らす</div>

          <h3 style={planTitle}>Pro</h3>
          <p style={planPrice}>月額 149,800円（税込）</p>

          <p style={planDesc}>検知から一歩進み、条件に基づく「自動リスク制御支援」へ</p>

          <ul style={planList}>
            <li>リスクスコア分析（参考指標）</li>
            <li>原因別内訳表示（何が効いているか）</li>
            <li>高リスクイベント詳細表示（判断材料の補強）</li>
            <li>
              条件に基づくリスクレベル調整（一定時間・自動）
              <span style={smallGray}>※運営ポリシーに基づく設定</span>
            </li>
          </ul>

          <div style={planNote}>
            異常兆候が出たとき、運営の対応を「属人化させず」「自動で一定時間サポート」したい場合に。
            <br />
            <span style={smallGray}>
              ※ 実際の決済承認可否は決済事業者・カード会社等の判断および加盟店契約条件に依存します。
            </span>
          </div>

          <Link href="/signup" style={planCtaSecondary}>
            Proを選択する
          </Link>
        </div>

        {/* Enterprise */}
        <div style={planCard}>
          <h3 style={planTitle}>Enterprise</h3>
          <p style={planPrice}>月額 300,000円〜</p>

          <p style={planDesc}>大規模運営向け：制御設計・運用体制まで含めて個別最適化</p>

          <ul style={planList}>
            <li>全機能利用可能</li>
            <li>制御条件の詳細設計（運営ポリシーに沿った運用）</li>
            <li>制御レベル選択・手動解除フロー（運用に合わせて設計）</li>
            <li>専任サポート（導入・運用支援）</li>
          </ul>

          <div style={planNote}>
            取引規模が大きく、リスク対応を<strong>運用設計として仕組み化</strong>したい場合に。
            <br />
            <span style={smallGray}>
              ※ 制御機能は加盟店ポリシーおよび決済事業者との契約条件の範囲内で提供されます。
            </span>
          </div>

          <Link href="/contact" style={planCtaSecondary}>
            お問い合わせ
          </Link>
        </div>
      </div>

      {/* 追加：比較の軸（短く、売るための要点だけ） */}
      <div style={{ marginTop: 34 }}>
        <div style={compareBox}>
          <div style={{ fontWeight: 800, marginBottom: 8, color: '#111827' }}>
            迷ったときの選び方（制御軸）
          </div>

          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.75 }}>
            <div style={{ marginBottom: 6 }}>
              <strong>Starter：</strong>履歴とKPIで「把握」を固める
            </div>
            <div style={{ marginBottom: 6 }}>
              <strong>Growth：</strong>通常時との差分で「兆候を検知」し判断の根拠を作る（主力）
            </div>
            <div style={{ marginBottom: 6 }}>
              <strong>Pro：</strong>条件に基づき「一定時間の自動調整」で対応を仕組みに寄せる
            </div>
            <div>
              <strong>Enterprise：</strong>制御設計・運用体制まで含め「組織で回る仕組み」を作る
            </div>
          </div>
        </div>
      </div>

      {/* 補足（審査・法務耐性） */}
      <div style={{ marginTop: 26 }}>
        <ul style={{ paddingLeft: 18, color: '#374151', fontSize: 14, margin: 0 }}>
          <li>お支払い方法：クレジットカード（pay.jp）</li>
          <li>契約期間途中の返金は行いません</li>
          <li>上限超過による追加課金はありません</li>
        </ul>

        <div style={legalBox}>
          <div style={{ fontWeight: 800, marginBottom: 8, color: '#111827' }}>
            重要事項
          </div>
          <ul style={{ paddingLeft: 18, margin: 0, color: '#4b5563', fontSize: 12, lineHeight: 1.7 }}>
            <li>本サービスは決済承認を保証するものではありません。</li>
            <li>最終的な承認可否は決済事業者・カード会社等の判断に基づきます。</li>
            <li>リスク制御に関する機能は加盟店の設定条件および契約範囲内で動作します。</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

/* =========================
   styles
========================= */

const planCard: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  padding: 24,
  background: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
}

const growthHighlight: React.CSSProperties = {
  border: '2px solid #111827',
  transform: 'scale(1.03)',
}

const popularBadge: React.CSSProperties = {
  position: 'absolute',
  top: -12,
  right: 20,
  background: '#111827',
  color: '#ffffff',
  fontSize: 12,
  padding: '4px 10px',
  borderRadius: 999,
  fontWeight: 800,
}

const proBadge: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  background: '#eef2ff',
  color: '#3730a3',
  fontSize: 11,
  padding: '4px 10px',
  borderRadius: 999,
  fontWeight: 800,
  border: '1px solid #e0e7ff',
}

const planTitle: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 20,
}

const planPrice: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 18,
  fontWeight: 800,
  color: '#111827',
}

const planDesc: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 14,
  fontWeight: 700,
  color: '#374151',
}

const planList: React.CSSProperties = {
  margin: '0 0 16px',
  paddingLeft: 18,
  color: '#374151',
  flexGrow: 1,
}

const planNote: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: 12,
  color: '#6b7280',
  lineHeight: 1.7,
}

const planCtaPrimary: React.CSSProperties = {
  display: 'block',
  textAlign: 'center',
  padding: '12px 16px',
  borderRadius: 10,
  background: '#111827',
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: 800,
}

const planCtaSecondary: React.CSSProperties = {
  display: 'block',
  textAlign: 'center',
  padding: '12px 16px',
  borderRadius: 10,
  border: '1px solid #111827',
  color: '#111827',
  textDecoration: 'none',
  fontWeight: 800,
  background: '#ffffff',
}

const subCtaNote: React.CSSProperties = {
  marginTop: 10,
  fontSize: 11,
  color: '#9ca3af',
  lineHeight: 1.6,
}

const smallGray: React.CSSProperties = {
  display: 'inline-block',
  marginLeft: 6,
  fontSize: 11,
  color: '#9ca3af',
}

const compareBox: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  padding: 16,
  background: '#f9fafb',
}

const legalBox: React.CSSProperties = {
  marginTop: 16,
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  padding: 16,
  background: '#ffffff',
}