import Link from 'next/link'

export default function Footer() {
    return (
        <footer
            style={{
                marginTop: 80,
                padding: '32px 20px',
                borderTop: '1px solid #e5e7eb',
                background: '#ffffff',
                fontSize: 14,
                color: '#374151',
            }}
        >
            <div
                style={{
                    maxWidth: 1100,
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                }}
            >
                {/* 法務・案内リンク */}
                <nav
                className="footer-nav"
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 12,
                        fontWeight: 600,
                    }}
                >
                    <Link href="/pricing">料金プラン</Link>
                    <Link href="/law">特定商取引法に基づく表記</Link>
                    <Link href="/terms">利用規約</Link>
                    <Link href="/privacy">プライバシーポリシー</Link>
                    <Link href="/cancel">解約方法</Link>
                    <Link href="/company">会社情報</Link>
                    <Link href="/contact">お問い合わせ</Link>
                </nav>

                {/* 補足・信頼 */}
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                    DatLynq は法人・事業者向けの業務支援SaaSです。
                </p>

                {/* コピーライト */}
                <p style={{ margin: 0, color: '#6b7280' }}>
                    © 2026 合同会社chillax
                </p>
            </div>
        </footer>
    )
}