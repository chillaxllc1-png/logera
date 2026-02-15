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
    | 'advanced_comparison'
    | 'enterprise_insights'

/* =========================
   プラン種別
========================= */
export type PlanKey = 'starter' | 'growth' | 'pro' | 'enterprise'

/* =========================
   Feature 定義
========================= */
export type FeatureDefinition = {
    key: FeatureKey
    name: string
    short: string          // ← 追加（タイトル直下用）
    description: string    // ← 補足説明（詳細）
    availablePlans: PlanKey[]
    href: string
}

/* =========================
   機能マスター
========================= */
export const FEATURES: Record<FeatureKey, FeatureDefinition> = {

    order_refund_history: {
        key: 'order_refund_history',
        name: '注文・返金履歴',
        short: '注文・返金対応の履歴を時系列で確認',
        description:
            '注文内容や返金対応の履歴を時系列で確認できます。過去の対応状況を把握し、判断の一貫性や対応スピードの向上に役立ちます。',
        availablePlans: ['starter', 'growth', 'pro', 'enterprise'], // ① Starter
        href: '/order-refund-history',
    },

    trend_analysis: {
        key: 'trend_analysis',
        name: '傾向分析',
        short: '返品率・返金傾向を俯瞰的に把握',
        description:
            '返品率や返金理由などの傾向を参考情報として確認できます。個別対応だけでなく、全体傾向を踏まえた判断に活用できます。',
        availablePlans: ['starter', 'growth', 'pro', 'enterprise'], // ② Starter
        href: '/order-refund-history',
    },

    identity_match: {
        key: 'identity_match',
        name: '一致情報チェック',
        short: '住所・IP・端末情報の一致を確認',
        description:
            '住所・IPアドレス・端末情報などをもとに、ユーザー情報の一致・不一致を確認できます。不正注文やなりすましの初期判断に役立ちます。',
        availablePlans: ['growth', 'pro', 'enterprise'], // ③ Growth
        href: '/order-refund-history',
    },

    advanced_comparison: {
        key: 'advanced_comparison',
        name: '高度な比較分析',
        short: '過去データとの詳細比較・変化検知',
        description:
            '日別・期間別のデータをもとに、過去との違いや変化の傾向を確認できます。通常時との差分把握や、判断材料の裏付けとして活用できます。',
        availablePlans: ['growth', 'pro', 'enterprise'], // ④ Growth
        href: '/order-refund-history',
    },

    risk_score: {
        key: 'risk_score',
        name: 'リスクスコア',
        short: '行動パターンから参考リスクを可視化',
        description:
            'ユーザーの行動パターンから算出した参考リスクスコアを確認できます。今後、自動判定や優先度付けなどの高度なリスク管理機能を追加予定です。',
        availablePlans: ['pro', 'enterprise'], // ⑤ Pro
        href: '/order-refund-history',
    },

    enterprise_insights: {
    key: 'enterprise_insights',
    name: 'エンタープライズ分析',
    short: '高度なリスク比較と詳細インサイト',
    description:
        '通常時との比較や高リスク挙動の詳細分析など、より高度な判断材料を提供します。大規模運用や厳密なリスク管理が必要な環境向けの機能です。',
    availablePlans: ['enterprise'], // ⑥ Enterprise
    href: '/order-refund-history',
},

}

/* =========================
   👇 UIで map 用（追加）
========================= */
export const FEATURE_LIST: FeatureDefinition[] = Object.values(FEATURES)