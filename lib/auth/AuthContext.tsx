'use client'

import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { supabase } from '@/lib/supabase/client'
import { fetchSubscriptionByUserId } from '@/lib/supabase/subscriptions'

export type SubscriptionPlan = 'Starter' | 'Growth' | 'Pro' | null

export type User = {
    id: string
    email?: string
}

type AuthContextType = {
    user: User | null
    isLoggedIn: boolean

    // null = DB未同期 / true,false = 同期後
    hasActiveSubscription: boolean | null
    subscriptionPlan: SubscriptionPlan

    // ✅ これは「session確定中」だけに使う
    isLoading: boolean

    refreshSubscription: () => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

/** DB取得が詰まってもアプリを固めないためのタイムアウト */
function withTimeout<T>(p: Promise<T>, ms = 6000): Promise<T> {
    return Promise.race([
        p,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), ms)
        ),
    ])
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    const [hasActiveSubscription, setHasActiveSubscription] =
        useState<boolean | null>(null)

    const [subscriptionPlan, setSubscriptionPlan] =
        useState<SubscriptionPlan>(null)

    // ✅ ここは「session確定」だけ
    const [isLoading, setIsLoading] = useState(true)

    const syncSubscriptionFromDB = async (uid: string) => {
        try {
            const sub = await withTimeout(fetchSubscriptionByUserId(uid), 6000)

            if (sub && sub.status === 'active') {
                setHasActiveSubscription(true)
                setSubscriptionPlan((sub.plan ?? 'Starter') as SubscriptionPlan)
            } else {
                setHasActiveSubscription(false)
                setSubscriptionPlan(null)
            }
        } catch (e) {
            // ✅ DBが落ちてても固めない（未同期扱い→UIで抑制）
            console.warn('syncSubscriptionFromDB failed:', e)
            setHasActiveSubscription(null)
            setSubscriptionPlan(null)
        }
    }

    const refreshSubscription = async () => {
        if (!user?.id) return
        await syncSubscriptionFromDB(user.id)
    }

    useEffect(() => {
        let alive = true

        const applySession = (session: any) => {
            if (!alive) return

            // ✅ ここで「ログインしてるか」をまず確定させる（DB待ちしない）
            if (!session?.user) {
                setUser(null)
                setIsLoggedIn(false)
                setHasActiveSubscription(null)
                setSubscriptionPlan(null)
                setIsLoading(false)
                return
            }

            const u: User = {
                id: session.user.id,
                email: session.user.email ?? undefined,
            }

            setUser(u)
            setIsLoggedIn(true)

            // ✅ sessionは確定したので loading終了（ここが肝）
            setIsLoading(false)

            // ✅ DB同期はバックグラウンドで（awaitしない）
            syncSubscriptionFromDB(u.id)
        }

        const boot = async () => {
            try {
                const { data } = await supabase.auth.getSession()
                applySession(data.session)
            } catch (e) {
                console.error('AuthProvider:getSession error', e)
                if (alive) {
                    setUser(null)
                    setIsLoggedIn(false)
                    setHasActiveSubscription(null)
                    setSubscriptionPlan(null)
                    setIsLoading(false)
                }
            }
        }

        boot()

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            applySession(session)
        })

        return () => {
            alive = false
            data.subscription.unsubscribe()
        }
    }, [])

    const logout = async () => {
        try {
            await supabase.auth.signOut()
        } finally {
            setUser(null)
            setIsLoggedIn(false)
            setHasActiveSubscription(null)
            setSubscriptionPlan(null)
            setIsLoading(false)
        }
    }

    const value = useMemo<AuthContextType>(
        () => ({
            user,
            isLoggedIn,
            hasActiveSubscription,
            subscriptionPlan,
            isLoading,
            refreshSubscription,
            logout,
        }),
        [user, isLoggedIn, hasActiveSubscription, subscriptionPlan, isLoading]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}