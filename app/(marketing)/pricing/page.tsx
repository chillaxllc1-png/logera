import Link from 'next/link'

export const metadata = {
    title: '料金プラン',
}

export default function Pricing() {
    return (
        <section
            style={{
                maxWidth: 980,
                margin: '0 auto',
                padding: '48px 20px 72px',
                lineHeight: 1.7,
            }}
        >
            {/* ヘッダー */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ margin: '0 0 10px', fontSize: 32 }}>料金プラン</h1>
                <p style={{ margin: 0, color: '#374151' }}>
                    DatLynq は月額課金制の法人向け業務支援SaaSです。
                    アカウント登録後、管理画面にてプランを選択し、
                    決済手続きが完了した時点から利用が開始されます。
                </p>
            </div>

            {/* 料金の考え方 */}
            <div
                style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 16,
                    padding: 20,
                    background: '#ffffff',
                    marginBottom: 32,
                }}
            >
                <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>料金設計について</h2>
                <p style={{ margin: 0, color: '#374151' }}>
                    料金は、取り込まれる注文件数の規模に応じて設定されています。
                    注文件数が増えるほど、整理・確認・判断に必要な業務負荷が高まるため、
                    利用規模に応じたプラン制としています。
                </p>
            </div>

            <p style={{ marginBottom: 16, color: '#6b7280', fontSize: 14 }}>
                まずは Starter で全体を把握し、必要に応じて Growth / Pro に拡張する構成です。
            </p>

            {/* プラン一覧 */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 16,
                }}
            >
                {/* Starter */}
                <div style={planCard}>
                    <h3 style={planTitle}>Starter</h3>
                    <p style={planPrice}>月額 19,800円（税込）</p>
                    <p style={planDesc}>月間注文件数 上限 3,000件</p>

                    <ul style={planList}>
                        <li>小規模〜立ち上げ期のEC事業者向け</li>
                        <li>返金対応・履歴確認の整理を始めたい場合</li>
                    </ul>

                    <Link href="/signup" style={planCtaPrimary}>
                        このプランで始める
                    </Link>
                </div>

                {/* Growth */}
                <div style={{ ...planCard, borderColor: '#111827' }}>
                    <h3 style={planTitle}>Growth</h3>
                    <p style={{ fontSize: 13, color: '#065f46', fontWeight: 700 }}>
                        最も選ばれているプラン
                    </p>
                    <p style={planPrice}>月額 49,800円（税込）</p>
                    <p style={planDesc}>月間注文件数 上限 10,000件</p>

                    <ul style={planList}>
                        <li>注文数・返金対応が安定的に発生している事業者向け</li>
                        <li>顧客単位での履歴確認を日常業務で行う場合</li>
                    </ul>

                    <Link href="/signup" style={planCtaPrimary}>
                        このプランで始める
                    </Link>
                </div>

                {/* Pro */}
                <div style={planCard}>
                    <h3 style={planTitle}>Pro</h3>
                    <p style={planPrice}>月額 99,800円（税込）</p>
                    <p style={planDesc}>月間注文件数 上限 30,000件</p>

                    <ul style={planList}>
                        <li>複数担当者での確認・対応が必要な事業者向け</li>
                        <li>対応履歴の整理・把握を重視する場合</li>
                    </ul>

                    <Link href="/signup" style={planCtaPrimary}>
                        このプランで始める
                    </Link>
                </div>
            </div>

            {/* 補足・条件 */}
            <div style={{ marginTop: 32 }}>
                <h2 style={{ margin: '0 0 10px', fontSize: 20 }}>補足事項</h2>
                <ul style={{ margin: 0, paddingLeft: 18, color: '#374151' }}>
                    <li>お支払い方法：クレジットカード（pay.jp）</li>
                    <li>初回申込時に当月分の利用料金が発生します</li>
                    <li>日割り計算は行いません</li>
                    <li>上限超過時に自動で追加課金は行いません（管理画面上での案内表示のみ）</li>
                    <li>契約期間途中の解約による返金は行いません</li>
                    <li>本サービスに無料トライアル期間はありません</li>
                </ul>
            </div>

            {/* 解約・安心 */}
            <div style={{ marginTop: 24 }}>
                <p style={{ margin: 0, color: '#111827' }}>
                    解約は、管理画面の「請求・契約」からいつでも行えます。
                    解約後も当月の契約期間末日まではご利用いただけます。
                </p>
            </div>

            {/* 最終CTA */}
            <div
                style={{
                    marginTop: 32,
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: 20,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
            >
                <p style={{ margin: 0, color: '#374151' }}>
                    プラン選択に迷う場合は、まず Starter から始めることも可能です。
                </p>

                <Link href="/signup" style={finalCta}>
                    新規登録へ進む
                </Link>
            </div>
        </section>
    )
}

/* styles */

const planCard: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 20,
    background: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
}

const planTitle: React.CSSProperties = {
    margin: '0 0 6px',
    fontSize: 20,
}

const planPrice: React.CSSProperties = {
    margin: '0 0 4px',
    fontSize: 18,
    fontWeight: 700,
}

const planDesc: React.CSSProperties = {
    margin: '0 0 12px',
    color: '#374151',
}

const planList: React.CSSProperties = {
    margin: '0 0 16px',
    paddingLeft: 18,
    color: '#374151',
    flexGrow: 1,
}

const planCtaPrimary: React.CSSProperties = {
    display: 'block',
    textAlign: 'center',
    padding: '10px 14px',
    borderRadius: 10,
    background: '#111827',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 700,
}

const finalCta: React.CSSProperties = {
    display: 'inline-block',
    padding: '10px 16px',
    borderRadius: 10,
    background: '#111827',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 700,
}