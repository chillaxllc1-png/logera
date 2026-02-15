import Link from 'next/link'

export const metadata = {
    title: 'Enterpriseプラン',
}

export default function EnterprisePage() {
    return (
        <section
            style={{
                maxWidth: 820,
                margin: '0 auto',
                padding: '56px 20px 100px',
                lineHeight: 1.7,
            }}
        >
            {/* =========================
          ヒーロー
      ========================= */}
            <div style={{ marginBottom: 48 }}>
                <h1
                    style={{
                        fontSize: 34,
                        fontWeight: 800,
                        marginBottom: 16,
                        lineHeight: 1.4,
                    }}
                >
                    あなたの損失、
                    本当に止められていますか？

                    <span style={{ fontSize: 18, fontWeight: 600, display: 'block', marginTop: 12 }}>
                        表面の数値では見えない「構造的リスク」まで把握できていますか？
                    </span>
                </h1>

                <p style={{ fontSize: 16, color: '#374151', maxWidth: 680 }}>
                    DatLynq Enterpriseは、
                    高額デジタル決済運営に特化した
                    <strong>個別最適化・専任設計プラン</strong>です。
                    <br />
                    数値の確認ではなく、
                    <strong>「原因特定」と「構造理解」</strong>まで踏み込みます。
                </p>
            </div>

            {/* =========================
          問題提起
      ========================= */}
            <div
                style={{
                    marginBottom: 48,
                    padding: 24,
                    borderRadius: 16,
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                }}
            >
                <h2 style={{ fontSize: 20, marginBottom: 16 }}>
                    こんな状態になっていませんか？
                </h2>

                <ul style={{ paddingLeft: 20, margin: 0, color: '#374151' }}>
                    <li>返金率が上がっているが、原因が特定できない</li>
                    <li>高額決済ユーザーの挙動を深く分析したい</li>
                    <li>感覚ではなく、データで判断したい</li>
                    <li>リスクを未然に止める構造を作りたい</li>
                </ul>
            </div>

            {/* =========================
          価値説明
      ========================= */}
            <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: 22, marginBottom: 16 }}>
                    Enterpriseでできること
                </h2>

                <div
                    style={{
                        display: 'grid',
                        gap: 16,
                    }}
                >
                    <FeatureBlock
                        title="率ベース多角比較分析"
                        text="単純な件数ではなく、構造的な変動率で異常を特定します。"
                    />

                    <FeatureBlock
                        title="変動要因の因数分解"
                        text="何がどれだけ影響しているのかを分解し、主因を明確化します。"
                    />

                    <FeatureBlock
                        title="専任分析設計"
                        text="運営特性に合わせた分析ロジックを個別に設計します。"
                    />

                    <FeatureBlock
                        title="高額決済特化構造"
                        text="少額大量ではなく、高額決済特有のリスク構造に最適化します。"
                    />
                </div>
            </div>

            {/* =========================
          価格
      ========================= */}
            <div
                style={{
                    marginBottom: 48,
                    padding: 24,
                    borderRadius: 16,
                    border: '2px solid #111827',
                }}
            >
                <h2 style={{ fontSize: 20, marginBottom: 8 }}>
                    料金
                </h2>

                <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                    月額固定 / 個別見積もり
                </p>

                <p style={{ fontSize: 16, color: '#374151' }}>
                    目安：<strong>300,000円〜</strong>
                </p>

                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
                    ※ 月間損失が100万円を超える運営では、導入効果が明確に出やすい設計です
                </p>
            </div>

            {/* =========================
          最終CTA
      ========================= */}
            <div
                style={{
                    textAlign: 'center',
                    paddingTop: 32,
                    borderTop: '1px solid #e5e7eb',
                }}
            >
                <p
                    style={{
                        fontSize: 18,
                        fontWeight: 700,
                        marginBottom: 20,
                    }}
                >
                    この変動、原因まで特定しますか？
                </p>

                <Link
                    href="/enterprise/contact"
                    style={{
                        display: 'inline-block',
                        padding: '14px 28px',
                        borderRadius: 12,
                        background: '#111827',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: 16,
                        textDecoration: 'none',
                    }}
                >
                    まずは状況を共有して相談する（無料）
                </Link>
            </div>
        </section>
    )
}

/* =========================
   Feature Block
========================= */

function FeatureBlock({
    title,
    text,
}: {
    title: string
    text: string
}) {
    return (
        <div
            style={{
                padding: 20,
                borderRadius: 14,
                border: '1px solid #e5e7eb',
                background: '#ffffff',
            }}
        >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
                {title}
            </div>
            <div style={{ fontSize: 14, color: '#4b5563' }}>
                {text}
            </div>
        </div>
    )
}