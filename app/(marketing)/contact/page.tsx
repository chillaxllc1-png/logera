export const metadata = {
    title: 'お問い合わせ',
}

export default function Contact() {
    return (
        <section
            style={{
                maxWidth: 720,
                margin: '0 auto',
                padding: '48px 20px 72px',
                lineHeight: 1.7,
            }}
        >
            <h1 style={{ margin: '0 0 20px' }}>お問い合わせ</h1>

            <p style={{ margin: '0 0 24px', color: '#374151' }}>
                本サービスに関するご質問やご不明点がございましたら、
                以下の窓口までお問い合わせください。
            </p>

            <div
                style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 16,
                    padding: 20,
                    background: '#ffffff',
                }}
            >
                <div style={row}>
                    <p style={label}>お問い合わせ方法</p>
                    <p style={value}>メール</p>
                </div>

                <div style={row}>
                    <p style={label}>メールアドレス</p>
                    <p style={value}>chillaxllc1@gmail.com</p>
                </div>

                <div style={{ marginTop: 12 }}>
                    <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                        ※ お問い合わせ内容によっては、回答にお時間をいただく場合があります。
                    </p>
                </div>
            </div>
        </section>
    )
}

const row: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '140px 1fr',
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