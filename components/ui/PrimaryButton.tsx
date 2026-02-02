'use client'

import React from 'react'

type PrimaryButtonProps = {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
    type?: 'button' | 'submit'
}

export default function PrimaryButton({
    children,
    onClick,
    disabled = false,
    type = 'button',
}: PrimaryButtonProps) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: '10px 18px',
                borderRadius: 999,
                background: disabled ? '#9ca3af' : '#111827',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 14,
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
            }}
        >
            {children}
        </button>
    )
}