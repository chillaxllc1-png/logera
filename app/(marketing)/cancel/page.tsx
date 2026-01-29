export const metadata = {
    title: '解約方法',
}

export default function Cancel() {
    return (
        <section
            style={{
                maxWidth: 720,
                margin: '0 auto',
                padding: '48px 20px 72px',
                lineHeight: 1.7,
            }}
        >
            <h1 style={{ margin: '0 0 24px' }}>解約方法（FAQ）</h1>

            <div style={card}>
                <p style={q}>Q1. 解約はできますか？</p>
                <p style={a}>
                    はい。管理画面の「請求・契約」から、いつでも解約手続きを行うことができます。
                </p>
            </div>

            <div style={card}>
                <p style={q}>Q2. 解約するといつまで利用できますか？</p>
                <p style={a}>
                    解約手続き後も、当月の契約期間末日まではご利用いただけます。
                    翌月以降の請求は発生しません。
                </p>
            </div>

            <div style={card}>
                <p style={q}>Q3. 解約後のデータはどうなりますか？</p>
                <p style={a}>
                    解約後、一定期間（30日間）データを保持し、その後自動削除します。
                    削除後は復元できません。
                </p>
            </div>

            <div style={card}>
                <p style={q}>Q4. 途中解約の返金はありますか？</p>
                <p style={a}>
                    原則として返金は行いません。
                    詳細は「特定商取引法に基づく表記」および「利用規約」をご確認ください。
                </p>
            </div>
        </section>
    )
}

const card: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: 18,
    background: '#ffffff',
    marginBottom: 16,
}

const q: React.CSSProperties = {
    margin: 0,
    fontWeight: 800,
    color: '#111827',
}

const a: React.CSSProperties = {
    margin: '8px 0 0',
    color: '#374151',
}