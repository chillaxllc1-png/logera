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
import { FEATURES } from '@/lib/features'

/* =========================
   型定義
========================= */

export type User = {
    id: string
    email?: string
}

export type AuthContextType = {
    user: User | null
    isLoggedIn: boolean

    hasActiveSubscription: boolean | null
    subscriptionPlan: PlanKey | null
    subscriptionStatus: ActiveSubscriptionSnapshot['status']
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    nextPlanId: string | null

    userRequestedCancel: boolean
    userRequestedPlanChange: boolean

    isLoading: boolean

    canUseFeature: (featureKey: FeatureKey) => boolean
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

    const [nextPlanId, setNextPlanId] =
        useState<string | null>(null)

    const [userRequestedCancel, setUserRequestedCancel] =
        useState<boolean>(false)

    const [userRequestedPlanChange, setUserRequestedPlanChange] =
        useState<boolean>(false)

    const [isLoading, setIsLoading] = useState(true)

    const [billingError, setBillingError] = useState<string | null>(null)

    /* =========================
       subscription 同期
    ========================= */

    const syncSubscriptionFromDB = async (uid: string) => {
        try {

            // =========================
            // 🔓 制限解除チェック（auto_release_at）
            // =========================
            const { data: risk } = await supabase
                .from('risk_controls')
                .select('status, auto_release_at')
                .eq('user_id', uid)
                .maybeSingle()

            if (
                risk?.status === 'restricted' &&
                risk.auto_release_at &&
                new Date(risk.auto_release_at) <= new Date()
            ) {
                await supabase
                    .from('risk_controls')
                    .update({
                        status: 'normal',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', uid)
            }

            const snap = await withTimeout(
                fetchActiveSubscriptionSnapshotByUserId(uid),
                6000
            )

            const isActive =
                snap.status === 'active' ||
                snap.status === 'past_due'

            setSubscriptionStatus(snap.status)
            setCurrentPeriodEnd(snap.currentPeriodEnd)
            setCancelAtPeriodEnd(snap.cancelAtPeriodEnd)
            setSubscriptionPlan(snap.planKey)
            setNextPlanId(snap.nextPlanId ?? null)
            setHasActiveSubscription(isActive)
            setUserRequestedCancel(snap.userRequestedCancel ?? false)
            setUserRequestedPlanChange(snap.userRequestedPlanChange ?? false)

        } catch (e) {
            console.warn('syncSubscriptionFromDB failed:', e)

            setHasActiveSubscription(null)
            setSubscriptionStatus(null)
            setCurrentPeriodEnd(null)
            setCancelAtPeriodEnd(false)
            setNextPlanId(null)
            setUserRequestedCancel(false)
            setUserRequestedPlanChange(false)
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
                setSubscriptionStatus(null)
                setCurrentPeriodEnd(null)
                setCancelAtPeriodEnd(false)
                setNextPlanId(null)
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
            } catch {
                setIsLoading(false)
            }
        }

        boot()

        const { data } = supabase.auth.onAuthStateChange(
            (_event, session) => applySession(session)
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
        await supabase.auth.signOut()
        setUser(null)
        setIsLoggedIn(false)
        setHasActiveSubscription(null)
        setSubscriptionPlan(null)
        setSubscriptionStatus(null)
        setCurrentPeriodEnd(null)
        setCancelAtPeriodEnd(false)
        setNextPlanId(null)
        setUserRequestedCancel(false)
        setUserRequestedPlanChange(false)
        setIsLoading(false)
    }

    /* =========================
       feature 判定（唯一の真実）
    ========================= */

    const canUseFeature = (featureKey: FeatureKey): boolean => {
        if (!user) return false
        if (hasActiveSubscription !== true) return false

        if (
            subscriptionStatus === 'past_due' ||
            subscriptionStatus === 'expired'
        ) {
            return false
        }

        if (!subscriptionPlan) return false

        const feature = FEATURES[featureKey]
        if (!feature) return false

        return feature.availablePlans.includes(subscriptionPlan)
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
            nextPlanId,
            isLoading,
            canUseFeature,
            refreshSubscription,
            userRequestedCancel,
            userRequestedPlanChange,
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
            nextPlanId,
            userRequestedCancel,
            userRequestedPlanChange,
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