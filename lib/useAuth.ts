// lib/useAuth.ts
'use client'

import { useEffect, useState } from 'react'

type User = {
    id: string
}

export type SubscriptionPlan = 'Starter' | 'Growth' | 'Pro' | null

const STORAGE_KEY = 'logera-auth'

type StoredAuthState = {
    isLoggedIn: boolean
    hasActiveSubscription: boolean
    subscriptionPlan: SubscriptionPlan
}

export function useAuth() {
    /**
     * =========================
     * State
     * =========================
     */
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
    const [hasActiveSubscription, setHasActiveSubscription] =
        useState<boolean>(false)
    const [subscriptionPlan, setSubscriptionPlan] =
        useState<SubscriptionPlan>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)

    /**
     * =========================
     * 初期化（localStorage → state）
     * =========================
     */
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) {
                const data: StoredAuthState = JSON.parse(raw)
                setIsLoggedIn(data.isLoggedIn)
                setHasActiveSubscription(data.hasActiveSubscription)
                setSubscriptionPlan(data.subscriptionPlan)
            } else {
                // 仮：ログイン済前提（あとで消す）
                setIsLoggedIn(true)
            }
        } catch {
            // 失敗時は安全側
            setIsLoggedIn(false)
        } finally {
            setIsLoading(false)
        }
    }, [])

    /**
     * =========================
     * 永続化（state → localStorage）
     * =========================
     */
    useEffect(() => {
        if (isLoading) return

        const data: StoredAuthState = {
            isLoggedIn,
            hasActiveSubscription,
            subscriptionPlan,
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }, [isLoggedIn, hasActiveSubscription, subscriptionPlan, isLoading])

    /**
     * =========================
     * ユーザー情報
     * =========================
     */
    const user: User | null = isLoggedIn
        ? { id: 'dummy-user' }
        : null

    /**
     * =========================
     * Actions
     * =========================
     */

    /**
     * checkout から呼ばれる想定
     * 課金成立 → サブスク有効化
     */
    const activateSubscription = (
        plan: SubscriptionPlan = 'Starter'
    ) => {
        setHasActiveSubscription(true)
        setSubscriptionPlan(plan)
    }

    /**
     * 将来用：ログアウト
     */
    const logout = () => {
        setIsLoggedIn(false)
        setHasActiveSubscription(false)
        setSubscriptionPlan(null)
        localStorage.removeItem(STORAGE_KEY)
    }

    /**
     * =========================
     * return（絶対に削らない）
     * =========================
     */
    return {
        // state
        isLoggedIn,
        hasActiveSubscription,
        subscriptionPlan,
        isLoading,
        user,

        // setters（将来用）
        setIsLoggedIn,
        setIsLoading,

        // actions
        activateSubscription,
        logout,
    }
}