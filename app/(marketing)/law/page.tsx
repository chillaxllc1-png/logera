export const metadata = {
    title: '特定商取引法に基づく表記',
}

export default function Law() {
    return (
        <section
            style={{
                maxWidth: 760,
                margin: '0 auto',
                padding: '48px 20px 72px',
                lineHeight: 1.7,
            }}
        >
            <h1 style={{ margin: '0 0 24px' }}>特定商取引法に基づく表記</h1>

            <div style={box}>
                <Item label="販売事業者名">合同会社chillax</Item>
                <Item label="運営責任者">矢嶋 弘和</Item>
                <Item label="所在地">
                    〒350-0023<br />
                    埼玉県川越市大字並木246-1
                </Item>
                <Item label="連絡先">
                    メールアドレス：chillaxllc1@gmail.com
                    <br />
                    ※お問い合わせは原則としてメールにて受け付けております。
                </Item>
                <Item label="販売価格">
                    各サービスの月額利用料は、料金ページに表示された金額とします（消費税込）。
                </Item>
                <Item label="商品（役務）の内容">
                    本サービスは、EC事業者向けに、注文および返金対応に関する情報を整理・可視化し、
                    利用者が判断するための参考情報を提供するクラウド型ソフトウェアサービス（SaaS）です。
                </Item>
                <Item label="商品（役務）の提供時期">
                    決済手続き完了後、アカウントが有効化され次第、直ちに利用可能となります。
                </Item>
                <Item label="支払方法">クレジットカード決済（pay.jp）</Item>
                <Item label="支払時期">
                    初回申込時に当月分の利用料金が発生し、以後は初回申込日を起点として、
                    毎月同日に翌月分の利用料金が自動的に課金されます。
                </Item>
                <Item label="解約について">
                    利用者は、管理画面の「請求・契約」ページより、いつでも解約手続きを行うことができます。
                    <br />
                    解約手続き完了後も、当月の契約期間末日までは本サービスを利用できます。
                    翌月以降の利用料金は発生しません。
                </Item>
                <Item label="返金について">
                    本サービスの性質上、契約期間途中で解約された場合であっても、
                    すでに支払われた利用料金の返金は行いません。
                </Item>
                <Item label="動作環境">
                    最新の主要ブラウザ（Google Chrome、Safari 等）での利用を推奨します。
                </Item>
            </div>
        </section>
    )
}

function Item({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div style={row}>
            <p style={labelStyle}>{label}</p>
            <p style={valueStyle}>{children}</p>
        </div>
    )
}

const box: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 20,
    background: '#ffffff',
}

const row: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '200px 1fr',
    gap: 16,
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6',
}

const labelStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
    color: '#374151',
}

const valueStyle: React.CSSProperties = {
    margin: 0,
    color: '#111827',
}