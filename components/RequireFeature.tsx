'use client'

import React from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import type { FeatureKey } from '@/lib/features'

type RequireFeatureProps = {
    feature: FeatureKey
    children: React.ReactNode
}

export function RequireFeature({
    feature,
    children,
}: RequireFeatureProps) {
    const { isLoading, canUseFeature } = useAuth()

    if (isLoading) return null

    if (!canUseFeature(feature)) {
        return (
            <div
                style={{
                    padding: 24,
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    background: '#f9fafb',
                    color: '#6b7280',
                    textAlign: 'center',
                    fontSize: 14,
                }}
            >
                この機能は現在のプランではご利用いただけません。
            </div>
        )
    }

    return <>{children}</>
}