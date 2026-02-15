// lib/planColors.ts
/**
 * プラン別カラー定義
 *
 * ルール:
 * - プラン = 色相（Hue）
 * - 状態 = 明度 / 彩度 / 役割
 *
 * UI 全体でこのファイルのみを参照する
 */

// lib/planColors.ts
import type { PlanKey } from '@/lib/features'

export type PlanColor = {
    soft: string
    bg: string
    border: string
    strong: string
}

export const PLAN_COLORS: Record<PlanKey, PlanColor> = {
    starter: {
        soft: '#f1f5f9',
        bg: '#f8fafc',
        border: '#cbd5e1',
        strong: '#334155',
    },

    growth: {
        soft: '#e0f2fe',
        bg: '#ecfeff',
        border: '#38bdf8',
        strong: '#0369a1',
    },

    pro: {
        soft: '#ede9fe',
        bg: '#f5f3ff',
        border: '#8b5cf6',
        strong: '#5b21b6',
    },

    enterprise: {
        soft: '#fef3c7',
        bg: '#fffbeb',
        border: '#f59e0b',
        strong: '#b45309',
    },
}