export const metadata = {
    title: '利用規約',
}

export default function Terms() {
    return (
        <section
            style={{
                maxWidth: 900,
                margin: '0 auto',
                padding: '56px 20px 80px',
                lineHeight: 1.8,
                color: '#111827',
            }}
        >
            <h1 style={{ margin: '0 0 24px', fontSize: 28 }}>
                利用規約
            </h1>

            <p style={{ marginBottom: 32, color: '#374151' }}>
                本利用規約（以下「本規約」）は、合同会社chillax（以下「当社」）が提供する本サービスの
                利用条件を定めるものです。利用者は、本規約に同意の上、本サービスを利用するものとします。
            </p>

            {/* 第1条 */}
            <section style={block}>
                <h2 style={heading}>第1条（本サービスの内容）</h2>
                <ol>
                    <li>
                        本サービスは、注文・返金対応に関する履歴等を整理・可視化し、
                        利用者が判断するための参考情報を提供する業務支援サービスです。
                    </li>
                    <li>
                        当社は、本サービスが不正の有無や特定の意図を判定・断定すること、
                        出荷停止・返金可否等の判断を自動化することを保証しません。
                        最終判断は利用者が行うものとします。
                    </li>
                </ol>
            </section>

            {/* 第2条 */}
            <section style={block}>
                <h2 style={heading}>第2条（アカウント）</h2>
                <ol>
                    <li>利用者は、真実かつ正確な情報を登録するものとします。</li>
                    <li>
                        利用者は、アカウント情報の管理責任を負い、
                        第三者による不正利用が生じた場合でも、
                        当社に故意または重過失がない限り当社は責任を負いません。
                    </li>
                </ol>
            </section>

            {/* 第3条 */}
            <section style={block}>
                <h2 style={heading}>第3条（利用料金・支払い）</h2>
                <ol>
                    <li>利用料金は料金ページに定めるとおりとします。</li>
                    <li>
                        支払いは月額課金（前払い）とし、初回申込日を起点に毎月自動更新されます。
                        日割り計算は行いません。
                    </li>
                </ol>
            </section>

            {/* 第4条 */}
            <section style={block}>
                <h2 style={heading}>第4条（解約）</h2>
                <ol>
                    <li>利用者は、管理画面所定の方法により、いつでも解約できます。</li>
                    <li>
                        解約後も当月の契約期間末日まで利用でき、翌月以降の請求は発生しません。
                    </li>
                    <li>原則として、契約期間途中の解約による返金は行いません。</li>
                </ol>
            </section>

            {/* 第5条 */}
            <section style={block}>
                <h2 style={heading}>第5条（データの取扱いと保持）</h2>
                <ol>
                    <li>
                        利用者が本サービスへ取り込むデータは、
                        利用者の責任において適法に取得・利用されているものとします。
                    </li>
                    <li>
                        当社は、本サービス提供のために必要な範囲でデータを取り扱います。
                    </li>
                    <li>
                        解約後、当社はデータを30日間保持し、その後自動削除します
                        （法令上の保存義務がある場合を除く）。
                    </li>
                </ol>
            </section>

            {/* 第6条 */}
            <section style={block}>
                <h2 style={heading}>第6条（禁止事項）</h2>
                <ul>
                    <li>法令または公序良俗に反する行為</li>
                    <li>当社または第三者の権利を侵害する行為</li>
                    <li>本サービスの運営を妨げる行為</li>
                    <li>不正アクセス、過度な負荷を与える行為</li>
                </ul>
            </section>

            {/* 第7条 */}
            <section style={block}>
                <h2 style={heading}>第7条（免責）</h2>
                <ol>
                    <li>当社は、本サービスの情報が特定の結果をもたらすことを保証しません。</li>
                    <li>
                        利用者が本サービスの情報を用いて行った判断・運用により生じた損害について、
                        当社は当社の故意または重過失がない限り責任を負いません。
                    </li>
                </ol>
            </section>

            {/* 第8条 */}
            <section style={block}>
                <h2 style={heading}>第8条（規約の変更）</h2>
                <p>
                    当社は、必要に応じて本規約を変更できるものとし、
                    変更内容は本サイト上で周知します。
                </p>
            </section>

            {/* 第9条 */}
            <section style={block}>
                <h2 style={heading}>第9条（準拠法・管轄）</h2>
                <p>
                    本規約は日本法に準拠し、本サービスに関して紛争が生じた場合、
                    東京地方裁判所を第一審の専属的合意管轄裁判所とします。
                </p>
            </section>
        </section>
    )
}

/* styles */

const block: React.CSSProperties = {
    marginBottom: 28,
}

const heading: React.CSSProperties = {
    margin: '0 0 10px',
    fontSize: 20,
}