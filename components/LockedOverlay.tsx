'use client'

import Link from 'next/link'
import React from 'react'
import LockIcon from '@/components/icons/LockIcon'

type LockedOverlayVariant = 'upgrade' | 'readonly'

type LockedOverlayProps = {
    /**
     * upgrade  : 上位プランが必要
     * readonly : 支払い失敗 / 期限切れ
     */
    variant: LockedOverlayVariant
}

export default function LockedOverlay({ variant }: LockedOverlayProps) {
    // =========================
    // 文言・導線の一元管理
    // =========================
    const content =
        variant === 'readonly'
            ? {
                  title: '操作が制限されています',
                  description:
                      'お支払い状況の確認が必要なため、現在この機能は操作できません。',
                  ctaLabel: '請求・契約を確認する',
                  href: '/billing',
              }
            : {
                  title: '上位プランでご利用いただけます',
                  description:
                      'この機能は現在のプランではご利用いただけません。',
                  ctaLabel: 'プランを確認する',
                  href: '/billing',
              }

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                background: 'rgba(255, 251, 235, 0.94)',
                border: '1px solid #fde68a',
                borderRadius: 16,

                padding: 20,
                textAlign: 'center',
            }}
        >
            <div>
                {/* タイトル */}
                <p
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        margin: '0 0 16px',

                        fontWeight: 800,
                        fontSize: 15,
                        color: '#92400e',
                    }}
                >
                    <LockIcon />
                    {content.title}
                </p>

                {/* 説明 */}
                <p
                    style={{
                        margin: '0 0 14px',
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: '#a16207',
                    }}
                >
                    {content.description}
                </p>

                {/* CTA */}
                <Link
                    href={content.href}
                    style={{
                        display: 'inline-block',
                        padding: '8px 18px',
                        borderRadius: 999,

                        background: '#111827',
                        color: '#ffffff',

                        fontWeight: 700,
                        fontSize: 14,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {content.ctaLabel}
                </Link>
            </div>
        </div>
    )
}