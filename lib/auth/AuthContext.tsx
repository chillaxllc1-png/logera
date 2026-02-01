'use client'

import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import {
    fetchActiveSubscriptionSnapshotByUserId,
    type ActiveSubscriptionSnapshot,
} from '@/lib/supabase/subscriptions'
import type { FeatureKey, PlanKey } from '@/lib/features'

/* =========================
   型定義
========================= */

export type User = {
    id: string
    email?: string
}

type AuthContextType = {
    user: User | null
    isLoggedIn: boolean

    // null = DB未同期 / true,false = 同期後
    hasActiveSubscription: boolean | null
    subscriptionPlan: PlanKey | null

    // subscription 詳細（STEP6用）
    subscriptionStatus: ActiveSubscriptionSnapshot['status']
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean

    // feature ベース制御
    featureKeys: FeatureKey[]
    canUseFeature: (featureKey: FeatureKey) => boolean

    // session確定中のみ true
    isLoading: boolean

    refreshSubscription: () => Promise<void>
    logout: () => Promise<void>
}

/* =========================
   Context
========================= */

const AuthContext = createContext<AuthContextType | null>(null)

/* =========================
   util
========================= */

function withTimeout<T>(p: Promise<T>, ms = 6000): Promise<T> {
    return Promise.race([
        p,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), ms)
        ),
    ])
}

/* =========================
   Provider
========================= */

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const supabase = useMemo(() => getSupabaseBrowserClient(), [])

    const [user, setUser] = useState<User | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    const [hasActiveSubscription, setHasActiveSubscription] =
        useState<boolean | null>(null)

    const [subscriptionPlan, setSubscriptionPlan] =
        useState<PlanKey | null>(null)

    const [subscriptionStatus, setSubscriptionStatus] =
        useState<ActiveSubscriptionSnapshot['status']>(null)

    const [currentPeriodEnd, setCurrentPeriodEnd] =
        useState<string | null>(null)

    const [cancelAtPeriodEnd, setCancelAtPeriodEnd] =
        useState<boolean>(false)

    const [featureKeys, setFeatureKeys] = useState<FeatureKey[]>([])

    const [isLoading, setIsLoading] = useState(true)

    /* =========================
       subscription 同期
    ========================= */

    const syncSubscriptionFromDB = async (uid: string) => {
        try {
            const snap = await withTimeout(
                fetchActiveSubscriptionSnapshotByUserId(uid),
                6000
            )

            setSubscriptionStatus(snap.status)
            setCurrentPeriodEnd(snap.currentPeriodEnd)
            setCancelAtPeriodEnd(snap.cancelAtPeriodEnd)

            if (snap.isActive) {
                setHasActiveSubscription(true)
                setSubscriptionPlan(snap.planKey)
                setFeatureKeys(snap.featureKeys)
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
            setSubscriptionStatus(null)
            setCurrentPeriodEnd(null)
            setCancelAtPeriodEnd(false)
        }
    }

    const refreshSubscription = async () => {
        if (!user?.id) return
        await syncSubscriptionFromDB(user.id)
    }

    /* =========================
       Auth session 管理
    ========================= */

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
                setSubscriptionStatus(null)
                setCurrentPeriodEnd(null)
                setCancelAtPeriodEnd(false)
                setIsLoading(false)
                return
            }

            const u: User = {
                id: session.user.id,
                email: session.user.email ?? undefined,
            }

            setUser(u)
            setIsLoggedIn(true)
            setIsLoading(false)

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
                    setSubscriptionStatus(null)
                    setCurrentPeriodEnd(null)
                    setCancelAtPeriodEnd(false)
                    setIsLoading(false)
                }
            }
        }

        boot()

        const { data } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                applySession(session)
            }
        )

        return () => {
            alive = false
            data.subscription.unsubscribe()
        }
    }, [supabase])

    /* =========================
       logout
    ========================= */

    const logout = async () => {
        try {
            await supabase.auth.signOut()
        } finally {
            setUser(null)
            setIsLoggedIn(false)
            setHasActiveSubscription(null)
            setSubscriptionPlan(null)
            setFeatureKeys([])
            setSubscriptionStatus(null)
            setCurrentPeriodEnd(null)
            setCancelAtPeriodEnd(false)
            setIsLoading(false)
        }
    }

    /* =========================
       feature 判定
    ========================= */

    const featureSet = useMemo(
        () => new Set(featureKeys),
        [featureKeys]
    )

    const canUseFeature = (featureKey: FeatureKey) => {
        if (hasActiveSubscription !== true) return false
        return featureSet.has(featureKey)
    }

    /* =========================
       Context value
    ========================= */

    const value = useMemo<AuthContextType>(
        () => ({
            user,
            isLoggedIn,
            hasActiveSubscription,
            subscriptionPlan,
            subscriptionStatus,
            currentPeriodEnd,
            cancelAtPeriodEnd,
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
            subscriptionStatus,
            currentPeriodEnd,
            cancelAtPeriodEnd,
            featureKeys,
            isLoading,
        ]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* =========================
   hook
========================= */

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) {
        throw new Error('useAuth must be used inside AuthProvider')
    }
    return ctx
}