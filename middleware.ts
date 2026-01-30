// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return req.cookies.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    res.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: any) {
                    res.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // 🔐 Supabase からログイン状態を取得
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isLoggedIn = !!user
    const pathname = req.nextUrl.pathname

    // 🔒 守りたいページ一覧
    const protectedPaths = [
        '/dashboard',
        '/billing',
        '/checkout',
    ]

    const isProtected = protectedPaths.some((path) =>
        pathname.startsWith(path)
    )

    // 🚫 未ログインで保護ページに来たら /login へ
    if (!isLoggedIn && isProtected) {
        const loginUrl = req.nextUrl.clone()
        loginUrl.pathname = '/login'
        return NextResponse.redirect(loginUrl)
    }

    return res
}

// 🎯 middleware を適用するパス
export const config = {
    matcher: [
        '/dashboard/:path*',
        '/billing/:path*',
        '/checkout/:path*',
    ],
}