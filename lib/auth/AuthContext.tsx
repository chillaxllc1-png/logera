'use client'

import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { fetchActiveSubscriptionSnapshotByUserId } from '@/lib/supabase/subscriptions'

export type SubscriptionPlan = 'starter' | 'pro' | null

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

    // ✅ 機能キー（plan_features）
    featureKeys: string[]
    canUseFeature: (featureKey: string) => boolean

    // session確定中のみ true
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
    // ✅ client component 内で生成（トップレベル生成しない）
    const supabase = useMemo(() => getSupabaseBrowserClient(), [])

    const [user, setUser] = useState<User | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    const [hasActiveSubscription, setHasActiveSubscription] =
        useState<boolean | null>(null)

    const [subscriptionPlan, setSubscriptionPlan] =
        useState<SubscriptionPlan>(null)

    const [featureKeys, setFeatureKeys] = useState<string[]>([])

    // session確定用
    const [isLoading, setIsLoading] = useState(true)

    const syncSubscriptionFromDB = async (uid: string) => {
        try {
            const snap = await withTimeout(
                fetchActiveSubscriptionSnapshotByUserId(uid),
                6000
            )

            if (snap.isActive) {
                setHasActiveSubscription(true)
                setSubscriptionPlan(snap.planKey)
                setFeatureKeys(snap.featureKeys ?? [])
            } else {
                setHasActiveSubscription(false)
                setSubscriptionPlan(null)
                setFeatureKeys([])
            }
        } catch (e) {
            console.warn('syncSubscriptionFromDB failed:', e)
            setHasActiveSubscription(null)
            setSubscriptionPlan(null)
            setFeatureKeys([])
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

            if (!session?.user) {
                setUser(null)
                setIsLoggedIn(false)
                setHasActiveSubscription(null)
                setSubscriptionPlan(null)
                setFeatureKeys([])
                setIsLoading(false)
                return
            }

            const u: User = {
                id: session.user.id,
                email: session.user.email ?? undefined,
            }

            setUser(u)
            setIsLoggedIn(true)

            // session は確定
            setIsLoading(false)

            // DB同期は裏で
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
                    setFeatureKeys([])
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
    }, [supabase])

    const logout = async () => {
        try {
            await supabase.auth.signOut()
        } finally {
            setUser(null)
            setIsLoggedIn(false)
            setHasActiveSubscription(null)
            setSubscriptionPlan(null)
            setFeatureKeys([])
            setIsLoading(false)
        }
    }

    const featureSet = useMemo(() => new Set(featureKeys), [featureKeys])

    const canUseFeature = (featureKey: string) => {
        // DB未同期の間は false（チラ見防止）
        if (hasActiveSubscription !== true) return false
        return featureSet.has(featureKey)
    }

    const value = useMemo<AuthContextType>(
        () => ({
            user,
            isLoggedIn,
            hasActiveSubscription,
            subscriptionPlan,
            featureKeys,
            canUseFeature,
            isLoading,
            refreshSubscription,
            logout,
        }),
        [
            user,
            isLoggedIn,
            hasActiveSubscription,
            subscriptionPlan,
            featureKeys,
            canUseFeature,
            isLoading,
        ]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) {
        throw new Error('useAuth must be used inside AuthProvider')
    }
    return ctx
}