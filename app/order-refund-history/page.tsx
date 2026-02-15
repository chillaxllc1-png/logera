export default function OrderRefundHistoryPage() {
    return (
        <section style={{ maxWidth: 720, margin: '0 auto', padding: '60px 20px' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>
                注文・返金履歴
            </h1>

            <p style={{ marginBottom: 24, color: '#374151' }}>
                このページでは以下の機能を提供予定です：
            </p>

            <ul style={{ lineHeight: 1.8 }}>
                <li>・注文一覧の時系列表示</li>
                <li>・返金履歴の確認</li>
                <li>・金額・日付フィルター</li>
                <li>・顧客検索機能</li>
            </ul>

            <div style={{ marginTop: 32, fontSize: 12, color: '#9ca3af' }}>
                ※ 現在はテスト段階のため、UIは順次実装予定です。
            </div>
        </section>
    )
}