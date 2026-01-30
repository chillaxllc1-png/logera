// lib/useAuth.ts
'use client'

import { useEffect, useState } from 'react'

/**
 * =========================
 * Types
 * =========================
 */

type User = {
    id: string
}

export type SubscriptionPlan = 'Starter' | 'Growth' | 'Pro' | null

/**
 * localStorage に保存する形
 * ※ 本番では DB / Auth に置き換える
 */
type StoredAuthState = {
    isLoggedIn: boolean
    hasActiveSubscription: boolean
    subscriptionPlan: SubscriptionPlan
}

const STORAGE_KEY = 'datlynq-auth'

/**
 * =========================
 * useAuth
 * =========================
 *
 * 【役割】
 * - 認証状態の一元管理
 * - 課金状態・プラン状態の保持
 * - Header / Dashboard / Billing など
 *   すべての分岐の唯一の情報源
 *
 * 【重要】
 * - return の形は将来も絶対に変えない
 * - 中身だけを本物実装に差し替えていく
 */
export function useAuth() {
    /**
     * =========================
     * State
     * =========================
     */
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
    const [subscriptionPlan, setSubscriptionPlan] =
        useState<SubscriptionPlan>(null)
    const [isLoading, setIsLoading] = useState(true)

    /**
     * =========================
     * 初期化
     * localStorage → state
     * =========================
     *
     * ・初回アクセス時
     * ・リロード時
     *
     * ※ デモ段階では
     *   「ログイン済み前提」を fallback として許容
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
                /**
                 * デモ用デフォルト
                 * 本番では削除して Auth 判定に置き換える
                 */
                setIsLoggedIn(true)
            }
        } catch {
            /**
             * 壊れたデータが入っていた場合は安全側
             */
            setIsLoggedIn(false)
            setHasActiveSubscription(false)
            setSubscriptionPlan(null)
        } finally {
            setIsLoading(false)
        }
    }, [])

    /**
     * =========================
     * 永続化
     * state → localStorage
     * =========================
     *
     * ※ 本番では DB / API に置き換える
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
     * User（ダミー）
     * =========================
     *
     * 本番では Auth Provider の user に置き換える
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
     * checkout 完了後に呼ばれる想定
     * 課金成立 → サブスク有効化
     */
    const activateSubscription = (
        plan: SubscriptionPlan = 'Starter'
    ) => {
        setHasActiveSubscription(true)
        setSubscriptionPlan(plan)
    }

    /**
     * デモ用ログアウト
     * ※ Header から呼ばれる
     */
    const logout = () => {
        setIsLoggedIn(false)
        setHasActiveSubscription(false)
        setSubscriptionPlan(null)
        localStorage.removeItem(STORAGE_KEY)
    }

    /**
     * =========================
     * return
     * =========================
     *
     * ⚠️ UI 側はこの形に依存している
     * ⚠️ 将来も絶対に壊さない
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