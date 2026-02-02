/**
 * DatLynq 機能マスター定義
 * - UI / 課金 / 権限 / 将来拡張 の単一ソース
 */

/* =========================
   Feature Key（DBと一致）
========================= */
export type FeatureKey =
    | 'identity_match'
    | 'order_refund_history'
    | 'risk_score'
    | 'trend_analysis'

/* =========================
   プラン種別
========================= */
export type PlanKey = 'starter' | 'growth' | 'pro'

/* =========================
   Feature 定義
========================= */
export type FeatureDefinition = {
    key: FeatureKey
    name: string
    description: string
    availablePlans: PlanKey[] // 使えるプラン
}

/* =========================
   機能マスター
========================= */
export const FEATURES: Record<FeatureKey, FeatureDefinition> = {
    identity_match: {
        key: 'identity_match',
        name: '一致情報チェック',
        description: '住所・IP・端末情報などの一致情報を確認できます。',
        availablePlans: ['growth', 'pro'],
    },

    order_refund_history: {
        key: 'order_refund_history',
        name: '注文・返金履歴',
        description: '注文および返金対応の履歴を時系列で確認できます。',
        availablePlans: ['starter', 'growth', 'pro'],
    },

    risk_score: {
        key: 'risk_score',
        name: 'リスクスコア',
        description: '行動パターンから算出した参考スコアを確認できます。（今後、自動判定・優先度付け機能を追加予定）',
        availablePlans: ['pro'],
    },

    trend_analysis: {
        key: 'trend_analysis',
        name: '傾向分析',
        description: '返品率や返金傾向などを参考情報として確認できます。',
        availablePlans: ['starter', 'growth', 'pro'],
    },
}

/* =========================
   👇 UIで map 用（追加）
========================= */
export const FEATURE_LIST: FeatureDefinition[] = Object.values(FEATURES)