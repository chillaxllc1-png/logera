// app/(marketing)/login/page.tsx

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import LoginForm from './LoginForm.tsx'

export const metadata = {
    title: 'ログイン｜DatLynq',
    description:
        '法人向け業務支援SaaS「DatLynq」のログインページです。',
}

export default function LoginPage() {
    return <LoginForm />
}