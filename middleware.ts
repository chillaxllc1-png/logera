// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    const response = NextResponse.next()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: any) {
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    const {
        data: { session },
    } = await supabase.auth.getSession()

    const pathname = request.nextUrl.pathname

    // ===== 公開ページ =====
    const publicPaths = [
        '/',
        '/login',
        '/signup',
        '/pricing',
        '/company',
        '/contact',
        '/privacy',
        '/terms',
    ]

    if (publicPaths.some((path) => pathname.startsWith(path))) {
        return response
    }

    // ===== 未ログインは login へ =====
    if (!session) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        return NextResponse.redirect(loginUrl)
    }

    return response
}

export const config = {
    matcher: [
        '/dashboard',
        '/dashboard/:path*',
        '/billing',
        '/billing/:path*',
        '/checkout',
        '/checkout/:path*',
    ],
}