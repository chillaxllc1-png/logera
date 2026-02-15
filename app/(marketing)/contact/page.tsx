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
            <h1 style={{ margin: '0 0 16px', fontSize: 28 }}>
                お問い合わせ・Enterpriseご相談
            </h1>

            <p style={{ margin: '0 0 24px', color: '#374151', lineHeight: 1.6 }}>
                DatLynqに関するご質問に加え、
                Enterpriseプランのご相談もこちらから承っております。
            </p>

            <div
                style={{
                    marginBottom: 28,
                    padding: 20,
                    borderRadius: 16,
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                }}
            >
                <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>
                    Enterpriseプランのご相談
                </h2>

                <p style={{ margin: '0 0 12px', color: '#374151', lineHeight: 1.6 }}>
                    以下のような運営体制をご検討の場合、
                    Enterpriseプランをご案内しております。
                </p>

                <ul style={{ margin: '0 0 12px', paddingLeft: 18, color: '#374151' }}>
                    <li>月間取引量が増加傾向にある</li>
                    <li>返金や不正対策の精度をさらに高めたい</li>
                    <li>判断ミスによる損失リスクを最小化したい</li>
                    <li>専任サポートを希望している</li>
                </ul>

                <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                    費用感や導入可否のご相談だけでも問題ありません。
                </p>
            </div>

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
                    <p style={value}>info@datlynq.com</p>
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