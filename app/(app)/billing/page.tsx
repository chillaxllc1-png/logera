import Link from 'next/link'

export const metadata = {
    title: '請求・契約',
}

export default function Billing() {
    return (
        <section
            style={{
                maxWidth: 720,
                margin: '0 auto',
                padding: '56px 20px 80px',
                lineHeight: 1.7,
            }}
        >
            <h1 style={{ margin: '0 0 12px', fontSize: 28 }}>
                請求・契約
            </h1>

            <p style={{ margin: '0 0 28px', color: '#374151' }}>
                現在のプラン内容、請求状況の確認、
                プラン変更や解約手続きを行えます。
            </p>

            {/* 現在の契約 */}
            <div style={card}>
                <h2 style={cardTitle}>現在の契約内容</h2>

                <dl style={dl}>
                    <div style={row}>
                        <dt style={dt}>契約プラン</dt>
                        <dd style={dd}>Starter（ダミー表示）</dd>
                    </div>
                    <div style={row}>
                        <dt style={dt}>月額料金</dt>
                        <dd style={dd}>19,800円（税込）</dd>
                    </div>
                    <div style={row}>
                        <dt style={dt}>次回請求日</dt>
                        <dd style={dd}>2026年3月31日（予定）</dd>
                    </div>
                    <div style={row}>
                        <dt style={dt}>支払方法</dt>
                        <dd style={dd}>クレジットカード（pay.jp）</dd>
                    </div>
                    <div style={row}>
                        <dt style={dt}>課金タイミング</dt>
                        <dd style={dd}>
                            初回申込日を起点として、毎月同日に自動課金
                        </dd>
                    </div>
                </dl>
            </div>

            {/* 支払い手続き */}
            <div
                style={{
                    ...card,
                    marginTop: 24,
                    borderColor: '#111827',
                    background: '#f9fafb',
                }}
            >
                <h2 style={cardTitle}>お支払い手続き</h2>

                <p style={{ margin: '0 0 12px', color: '#374151' }}>
                    DatLynq を利用するには、料金プランの確定と
                    お支払い手続きが必要です。
                    <br />
                    お支払い完了後、すぐに管理画面をご利用いただけます。
                </p>

                <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280' }}>
                    ※ 初回お申し込み時に当月分の利用料金が発生します。
                    日割り計算は行いません。
                </p>

                <Link href="/checkout" style={payButton}>
                    クレジットカードで支払う
                </Link>
            </div>

            {/* 解約について */}
            <div
                style={{
                    ...card,
                    marginTop: 24,
                    borderColor: '#ef4444',
                    background: '#fff5f5',
                }}
            >
                <h2 style={cardTitle}>解約について</h2>

                <p style={{ margin: '0 0 12px', color: '#374151' }}>
                    解約はいつでも行うことができます。
                    解約手続き後も、当月の契約期間末日までは本サービスを利用できます。
                </p>

                <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280' }}>
                    ※ 解約手続きが完了した時点で、翌月以降の請求は発生しません。
                    契約期間途中で解約された場合でも、すでに支払われた利用料金の返金は行いません。
                </p>

                <button disabled style={dangerButton}>
                    解約手続き（準備中）
                </button>
            </div>

            {/* 補足 */}
            <p style={{ marginTop: 32, fontSize: 13, color: '#6b7280' }}>
                ※ 本ページは初期表示イメージです。実際の請求・決済処理は順次実装予定です。
            </p>

            {/* 戻る */}
            <div style={{ marginTop: 24 }}>
                <Link href="/dashboard" style={backLink}>
                    管理画面に戻る
                </Link>
            </div>
        </section>
    )
}

/* styles */

const card: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 20,
    background: '#ffffff',
}

const cardTitle: React.CSSProperties = {
    margin: '0 0 16px',
    fontSize: 20,
}

const dl: React.CSSProperties = {
    margin: 0,
}

const row: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
}

const dt: React.CSSProperties = {
    fontWeight: 600,
    color: '#374151',
}

const dd: React.CSSProperties = {
    margin: 0,
    color: '#111827',
}

const dangerButton: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #fca5a5',
    background: '#fee2e2',
    color: '#991b1b',
    fontWeight: 700,
    cursor: 'not-allowed',
}

const backLink: React.CSSProperties = {
    textDecoration: 'none',
    color: '#374151',
    fontWeight: 600,
}

const payButton: React.CSSProperties = {
    padding: '12px 16px',
    borderRadius: 10,
    border: 'none',
    background: '#111827',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
    textDecoration: 'none',
}