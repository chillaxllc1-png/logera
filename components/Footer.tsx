import Link from 'next/link'

export default function Footer() {
    return (
        <footer>
            <nav>
                <Link href="/terms">利用規約</Link> |{' '}
                <Link href="/privacy">プライバシーポリシー</Link> |{' '}
                <Link href="/law">特定商取引法に基づく表記</Link> |{' '}
                <Link href="/company">会社情報</Link> |{' '}
                <Link href="/cancel">解約方法</Link> |{' '}
                <Link href="/contact">問い合わせ</Link>
            </nav>
            <p>© 2026 合同会社chillax</p>
        </footer>
    )
}