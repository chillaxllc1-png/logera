// lib/metadata.ts
import type { Metadata } from 'next'

export const siteName = 'DatLynq'

export const siteDescription =
    'DatLynq（データリンク）は、EC事業者向けに注文・返金対応に関する履歴や関連情報を整理・可視化し、担当者が判断するための参考情報を提供する業務支援SaaSです。不正の有無を判定・断定するものではありません。契約期間中は管理画面からいつでも解約できます。'

export const baseMetadata: Metadata = {
    title: {
        default: `${siteName}｜注文・返金対応の情報整理SaaS`,
        template: `%s｜${siteName}`,
    },
    description: siteDescription,
    robots: {
        index: true,
        follow: true,
    },
    authors: [
        {
            name: '合同会社chillax',
        },
    ],
    creator: '合同会社chillax',
    publisher: '合同会社chillax',
    metadataBase: new URL('https://datlynq.com'), // ドメイン確定後に変更可
}