import Link from 'next/link'

export default function Header() {
    return (
        <header>
            <nav>
                <Link href="/pricing">料金</Link> |{' '}
                <Link href="/cancel">解約方法</Link> |{' '}
                <Link href="/login">ログイン</Link> |{' '}
                <Link href="/signup">新規登録</Link>
            </nav>
        </header>
    )
}