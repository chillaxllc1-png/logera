'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

/* =====================
   Types
===================== */
type Row = {
    day: string // YYYY-MM-DD
    orders_count: number
}

type Props = {
    data: Row[]
    period: 7 | 30
}

/* =====================
   Utils
===================== */
function formatMd(day: string) {
    const parts = String(day).split('-')
    if (parts.length !== 3) return String(day)
    return `${Number(parts[1])}/${Number(parts[2])}`
}

/* =========================
   ② Y軸上限を “いい感じ” に丸める
========================= */
function getNiceYAxisMax(value: number) {
    if (value <= 4) return 4
    if (value <= 9) return 10
    if (value <= 19) return 20
    if (value <= 39) return 40
    if (value <= 79) return 80
    if (value <= 149) return 150

    // それ以上は桁で丸める
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
    return Math.ceil(value / magnitude) * magnitude
}

/* =====================
   Custom X Tick
===================== */
function CustomXAxisTick({
    x,
    y,
    payload,
    isMajor,
}: {
    x?: number | string
    y?: number | string
    payload?: { value: string }
    isMajor: boolean
}) {
    const tickX = typeof x === 'number' ? x : Number(x) || 0
    const tickY = typeof y === 'number' ? y : Number(y) || 0

    // 横軸に接地させるための微調整（実測ベース）
    const AXIS_Y_NUDGE = -8

    const majorLen = 10
    const minorLen = 5
    const lineLen = isMajor ? majorLen : minorLen

    return (
        <g transform={`translate(${tickX},${tickY + AXIS_Y_NUDGE})`}>
            <line
                x1={0}
                y1={0}
                x2={0}
                y2={lineLen}
                stroke="#9ca3af"
                strokeWidth={1}
            />

            {isMajor && (
                <text
                    x={0}
                    y={lineLen + 14}
                    textAnchor="middle"
                    fill="#374151"
                    fontSize={12}
                >
                    {formatMd(payload?.value ?? '')}
                </text>
            )}
        </g>
    )
}

/* =====================
   Component
===================== */
export default function OrdersBarChart({ data, period }: Props) {

    /* ---------- サイズ実測（警告対策） ---------- */
    const wrapRef = useRef<HTMLDivElement | null>(null)
    const [width, setWidth] = useState(0)
    const height = 240

    useEffect(() => {
        const el = wrapRef.current
        if (!el) return

        const ro = new ResizeObserver((entries) => {
            const w = Math.floor(entries[0]?.contentRect?.width ?? 0)
            if (w > 0) setWidth(w)
        })

        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    /* ---------- major tick 判定（先に定義！） ---------- */
    const labelDays = useMemo(() => {
        if (!data || data.length === 0) return new Set<string>()

        // 7日：先頭・中央・最後
        if (period === 7) {
            const first = data[0].day
            const last = data[data.length - 1].day
            const mid = data[Math.floor((data.length - 1) / 2)].day
            return new Set([first, mid, last])
        }

        // 30日：先頭・10日ごと・最後
        const set = new Set<string>()
        data.forEach((row, i) => {
            if (i === 0 || i === data.length - 1 || i % 10 === 0) {
                set.add(row.day)
            }
        })
        return set
    }, [data, period])

    /* ---------- minor tick 制御（labelDays を使う） ---------- */
    const minorAllowedIndexSet = useMemo(() => {
        // ★ 常に Set を返す
        if (period !== 30 || data.length === 0) {
            return new Set<number>()
        }

        // major tick の index 一覧
        const majorIndexes: number[] = []

        data.forEach((d, i) => {
            if (labelDays.has(d.day)) {
                majorIndexes.push(i)
            }
        })

        const allowed = new Set<number>()

        for (let i = 0; i < majorIndexes.length - 1; i++) {
            const start = majorIndexes[i]
            const end = majorIndexes[i + 1]
            const span = end - start

            if (span <= 2) continue

            // 各区間に最大2本
            const first = start + Math.floor(span / 3)
            const second = start + Math.floor((span * 2) / 3)

            allowed.add(first)
            allowed.add(second)
        }

        return allowed
    }, [period, data, labelDays])

    /* =========================
       ① maxOrders（Y軸の元になる最大値）
    ========================= */
    const maxOrders = useMemo(() => {
        if (data.length === 0) return 0
        return Math.max(...data.map(d => d.orders_count ?? 0))
    }, [data])

    /* ---------- 単一バー対策 ---------- */
    const nonZeroDays = useMemo(
        () => data.filter((d) => (d.orders_count ?? 0) > 0).length,
        [data]
    )
    const isSingleBarMode = nonZeroDays <= 1

    const yAxisMax = getNiceYAxisMax(maxOrders)

    // 目盛りは「0〜最大」を5分割（合計6個）
    const yTicks = useMemo(() => {
        if (yAxisMax <= 0) return [0]
        const step = yAxisMax / 5
        const ticks = Array.from({ length: 6 }, (_, i) =>
            Math.round(step * i)
        )
        return Array.from(new Set(ticks))
    }, [yAxisMax])

    return (
        <div
            ref={wrapRef}
            style={{
                width: '100%',
                height,
                minWidth: 0,
            }}
        >
            {width > 0 && (
                <BarChart
                    width={width}
                    height={height}
                    data={data}
                    /* ★ YAxis 前提で必ず中央に見える margin */
                    margin={{ top: 8, right: 16, left: 8, bottom: 18 }}
                    barCategoryGap={isSingleBarMode ? '55%' : '30%'}
                    barGap={isSingleBarMode ? 2 : 4}
                >
                    <XAxis
                        dataKey="day"
                        interval={0}
                        tickLine={false}
                        axisLine={{ stroke: '#9ca3af' }}   // ← 既存どおり残す
                        height={44}
                        padding={{ left: 18, right: 18 }}
                        tick={(props) => {
                            const index = props.index ?? 0
                            const day = String(props.payload?.value)

                            const isMajor = labelDays.has(day)

                            // minor tick を描くかどうかの判定
                            const showMinor =
                                period === 7 ||
                                isMajor ||
                                (period === 30 && minorAllowedIndexSet.has(index))

                            return showMinor ? (
                                <CustomXAxisTick
                                    x={props.x}
                                    y={props.y}
                                    payload={props.payload}
                                    isMajor={isMajor}
                                />
                            ) : null
                        }}
                    />

                    {/* ★ 必須：Y軸を消さない（中央寄せの要） */}
                    <YAxis
                        allowDecimals={false}
                        width={28}
                        tickLine={false}
                        axisLine={{ stroke: '#9ca3af' }}
                        domain={[0, yAxisMax]}
                        ticks={yTicks}
                    />

                    <Tooltip
                        cursor={
                            period === 7
                                ? { fill: 'rgba(37, 99, 235, 0.08)' }
                                : { fill: 'rgba(37, 99, 235, 0.04)' }
                        }
                        formatter={(value) => [`${Number(value)} 件`, '注文数']}
                        labelFormatter={(label) =>
                            period === 7
                                ? formatMd(String(label))
                                : `注文日：${formatMd(String(label))}`
                        }
                    />

                    <Bar
                        dataKey="orders_count"
                        fill="#2563eb"
                        radius={[6, 6, 0, 0]}
                        barSize={isSingleBarMode ? 18 : 24}
                    />
                </BarChart>
            )}
        </div>
    )
}