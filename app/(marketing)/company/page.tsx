export const metadata = {
    title: '会社情報',
}

export default function Company() {
    return (
        <section
            style={{
                maxWidth: 720,
                margin: '0 auto',
                padding: '48px 20px 72px',
                lineHeight: 1.7,
            }}
        >
            <h1 style={{ margin: '0 0 24px' }}>会社情報</h1>

            <div
                style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 16,
                    padding: 20,
                    background: '#ffffff',
                }}
            >
                <div style={row}>
                    <p style={label}>会社名</p>
                    <p style={value}>合同会社chillax</p>
                </div>

                <div style={row}>
                    <p style={label}>事業内容</p>
                    <p style={value}>
                        SaaS（クラウド型ソフトウェア）の企画・開発・提供
                    </p>
                </div>

                <div style={row}>
                    <p style={label}>提供サービス</p>
                    <p style={value}>
                        EC事業者向けに、注文・返金対応に関する情報を整理・可視化し、
                        担当者が判断するための参考情報を提供する業務支援サービス
                    </p>
                </div>
            </div>
        </section>
    )
}

const row: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    gap: 12,
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
}

const label: React.CSSProperties = {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
    color: '#374151',
}

const value: React.CSSProperties = {
    margin: 0,
    color: '#111827',
}