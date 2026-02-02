'use client'

import Link from 'next/link'
import React from 'react'

type ButtonVariant = 'primary' | 'secondary'

type ButtonLinkProps = {
    children: React.ReactNode
    href?: string
    onClick?: () => void
    disabled?: boolean
    variant?: ButtonVariant
    fullWidth?: boolean
}

export default function ButtonLink({
    children,
    href,
    onClick,
    disabled = false,
    variant = 'primary',
    fullWidth = false,
}: ButtonLinkProps) {
    const baseStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 18px',
        borderRadius: 999,
        fontWeight: 800,
        fontSize: 14,
        textDecoration: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        width: fullWidth ? '100%' : undefined,
        border: 'none',
    }

    const variants: Record<ButtonVariant, React.CSSProperties> = {
        primary: {
            background: '#111827',
            color: '#ffffff',
        },
        secondary: {
            background: '#f3f4f6',
            color: '#111827',
        },
    }

    const style = { ...baseStyle, ...variants[variant] }

    // 🔗 Link
    if (href) {
        return (
            <Link href={href} style={style} aria-disabled={disabled}>
                {children}
            </Link>
        )
    }

    // 🔘 button
    return (
        <button onClick={onClick} disabled={disabled} style={style}>
            {children}
        </button>
    )
}