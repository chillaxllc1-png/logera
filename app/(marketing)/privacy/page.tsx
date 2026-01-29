export const metadata = {
    title: 'プライバシーポリシー',
}

export default function Privacy() {
    return (
        <section
            style={{
                maxWidth: 820,
                margin: '0 auto',
                padding: '56px 20px 80px',
                lineHeight: 1.8,
            }}
        >
            <h1 style={{ margin: '0 0 24px', fontSize: 32 }}>
                プライバシーポリシー
            </h1>

            <p style={{ margin: '0 0 32px', color: '#374151' }}>
                合同会社chillax（以下「当社」）は、本サービス提供にあたり取得する
                利用者情報を、以下のとおり取り扱います。
            </p>

            {/* 1 */}
            <h2 style={heading}>1. 取得する情報</h2>
            <ul style={list}>
                <li>アカウント登録情報（会社名、氏名、メールアドレス等）</li>
                <li>
                    サービス利用に伴い取り込まれる業務データ
                    （注文・返金等の履歴情報）
                </li>
                <li>アクセスログ等（IPアドレス、ブラウザ情報、操作履歴等）</li>
            </ul>

            {/* 2 */}
            <h2 style={heading}>2. 利用目的</h2>
            <ul style={list}>
                <li>本サービスの提供、維持、改善</li>
                <li>問い合わせ対応、サポート提供</li>
                <li>利用状況の分析（個人を特定しない形での統計）</li>
                <li>セキュリティ確保、不正利用の抑止</li>
            </ul>

            {/* 3 */}
            <h2 style={heading}>3. 第三者提供</h2>
            <p style={paragraph}>
                当社は、法令に基づく場合を除き、本人同意なく第三者提供を行いません。
            </p>

            {/* 4 */}
            <h2 style={heading}>4. 委託</h2>
            <p style={paragraph}>
                当社は、本サービス運営に必要な範囲で、決済、ホスティング等の業務を
                外部事業者に委託することがあります。
            </p>

            {/* 5 */}
            <h2 style={heading}>5. 安全管理</h2>
            <p style={paragraph}>
                当社は、アクセス制御、暗号化等の合理的な安全管理措置を講じます。
            </p>

            {/* 6 */}
            <h2 style={heading}>6. 保持期間</h2>
            <p style={paragraph}>
                解約後、データは30日間保持し、その後自動削除します
                （法令上の保存義務がある場合を除く）。
            </p>

            {/* 7 */}
            <h2 style={heading}>7. お問い合わせ窓口</h2>
            <div
                style={{
                    marginTop: 12,
                    padding: 16,
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    background: '#ffffff',
                }}
            >
                <p style={{ margin: 0 }}>
                    メールアドレス：chillaxllc1@gmail.com
                </p>
                <p style={{ margin: '6px 0 0' }}>
                    所在地：〒350-0023 埼玉県川越市大字並木246-1
                </p>
            </div>
        </section>
    )
}

/* styles */

const heading: React.CSSProperties = {
    margin: '32px 0 10px',
    fontSize: 20,
}

const paragraph: React.CSSProperties = {
    margin: 0,
    color: '#374151',
}

const list: React.CSSProperties = {
    margin: 0,
    paddingLeft: 20,
    color: '#374151',
}