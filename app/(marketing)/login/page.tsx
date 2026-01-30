import LoginForm from './LoginForm'

export const metadata = {
    title: 'ログイン｜DatLynq',
    description:
        '法人向け業務支援SaaS「DatLynq」のログインページです。ログイン後は管理画面へ遷移します。',
}

export default function LoginPage() {
    return <LoginForm />
}