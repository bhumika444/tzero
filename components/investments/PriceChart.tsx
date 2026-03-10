'use client'

import React, { useState, useMemo, useRef } from 'react'
import {
    Box,
    Typography,
    Stack,
    alpha,
    useTheme,
    Grid,
    Paper,
} from '@mui/material'
import { TrendingUp, TrendingDown } from '@mui/icons-material'
import { formatCurrency } from '@/lib/investmentUtils'

interface ExtendedHistoryPoint extends HistoryPoint {
    x: number
    y: number
}

interface HistoryPoint {
    date: string
    close: number
    open?: number
    high?: number
    low?: number
    volume?: number
}

interface PriceChartProps {
    asset: any
}

export default function PriceChart({ asset }: PriceChartProps) {
    const theme = useTheme()
    const [hoverData, setHoverData] = useState<ExtendedHistoryPoint | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const history = useMemo(() => asset?.dailyHistory || [], [asset])
    const currentPrice = asset?.currentValue || 0
    const prevPrice = asset?.previousValue || 0
    const priceChange = currentPrice - prevPrice
    const percentChange = (priceChange / prevPrice) * 100
    const isPositive = priceChange >= 0

    const chartHeight = 300
    const chartWidth = 800

    // Calculate chart path points
    const pointsData = useMemo(() => {
        if (history.length === 0) return { path: '', area: '', pts: [], min: 0, max: 0, range: 0 }

        const prices = history.map((h: any) => h.close)
        const max = Math.max(...prices, currentPrice) * 1.002
        const min = Math.min(...prices, currentPrice) * 0.998
        const range = max - min

        const pts: ExtendedHistoryPoint[] = history.map((h: any, i: number) => {
            const x = (i / (history.length - 1)) * chartWidth
            const y = chartHeight - ((h.close - min) / range) * chartHeight
            return { x, y, ...h }
        })

        const path = pts.map((p: ExtendedHistoryPoint) => `${p.x},${p.y}`).join(' ')
        const area = `0,${chartHeight} ${path} ${chartWidth},${chartHeight}`

        return { path, area, pts, min, max, range }
    }, [history, chartHeight, chartWidth, currentPrice])

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current || !pointsData.pts || pointsData.pts.length === 0) return
        const rect = containerRef.current.getBoundingClientRect()
        const mouseX = ((e.clientX - rect.left) / rect.width) * chartWidth

        // Find closest point
        let closest = pointsData.pts[0]
        let minDist = Math.abs(mouseX - closest.x)

        for (const p of pointsData.pts) {
            const dist = Math.abs(mouseX - p.x)
            if (dist < minDist) {
                minDist = dist
                closest = p
            }
        }
        setHoverData(closest)
    }

    const handleMouseLeave = () => {
        setHoverData(null)
    }

    const primaryColor = isPositive ? '#00c853' : '#ff3d00'

    return (
        <Box sx={{ width: '100%' }}>
            {/* Header Info */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff' }}>
                    {formatCurrency(hoverData?.close || currentPrice)}
                    <Typography component="span" sx={{ ml: 1, fontSize: '18px', color: '#888' }}>USD</Typography>
                </Typography>
                <Typography sx={{
                    color: isPositive ? '#00c853' : '#ff4d4d',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '18px'
                }}>
                    {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({percentChange.toFixed(3)}%)
                    {isPositive ? <TrendingUp sx={{ ml: 0.5 }} /> : <TrendingDown sx={{ ml: 0.5 }} />}
                </Typography>
            </Box>

            {/* Main Chart */}
            <Box
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                sx={{
                    position: 'relative',
                    height: chartHeight + 40,
                    width: '100%',
                    cursor: 'crosshair'
                }}
            >
                <svg
                    width="100%"
                    height={chartHeight}
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    preserveAspectRatio="none"
                    style={{ overflow: 'visible' }}
                >
                    <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.15" />
                            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    <line x1="0" y1={chartHeight * 0.25} x2={chartWidth} y2={chartHeight * 0.25} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                    {/* Previous Close Reference Line */}
                    {pointsData.range !== 0 && (
                        <line
                            x1="0"
                            y1={chartHeight - ((prevPrice - pointsData.min) / pointsData.range) * chartHeight}
                            x2={chartWidth}
                            y2={chartHeight - ((prevPrice - pointsData.min) / pointsData.range) * chartHeight}
                            stroke="#555"
                            strokeDasharray="4 4"
                        />
                    )}

                    {/* Area Fill */}
                    <path d={`M ${pointsData.area} Z`} fill="url(#areaGradient)" />

                    {/* Main Line */}
                    <polyline
                        fill="none"
                        stroke={primaryColor}
                        strokeWidth="2.5"
                        points={pointsData.path}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

                    {/* Interactive Tooltip Vertical Line */}
                    {hoverData && (
                        <>
                            <line
                                x1={hoverData.x} y1="0"
                                x2={hoverData.x} y2={chartHeight}
                                stroke="#666"
                                strokeWidth="1"
                                strokeDasharray="2 2"
                            />
                            <circle
                                cx={hoverData.x}
                                cy={hoverData.y}
                                r="4"
                                fill={primaryColor}
                                stroke="#000"
                                strokeWidth="2"
                            />
                        </>
                    )}
                </svg>

                {/* X-Axis Labels */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 600 }}>{history[0]?.date || ''}</Typography>
                    <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 600 }}>{history[history.length - 1]?.date || ''}</Typography>
                </Box>

                {/* Hover Tooltip Box */}
                {hoverData && (
                    <Paper sx={{
                        position: 'absolute',
                        left: Math.min(Math.max(hoverData.x - 60, 0), chartWidth - 120),
                        top: -50,
                        p: '4px 10px',
                        backgroundColor: '#fff',
                        color: '#000',
                        borderRadius: '4px',
                        pointerEvents: 'none',
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}>
                        <Typography sx={{ fontSize: '13px', fontWeight: 800 }}>{formatCurrency(hoverData.close)}</Typography>
                        <Typography sx={{ fontSize: '11px', color: '#666', fontWeight: 600 }}>{hoverData.date}</Typography>
                    </Paper>
                )}

                {/* Previous Close Label */}
                {pointsData.range !== 0 && (
                    <Box sx={{ position: 'absolute', right: -5, top: chartHeight - ((prevPrice - pointsData.min) / pointsData.range) * chartHeight - 20, textAlign: 'right' }}>
                        <Typography sx={{ color: '#888', fontSize: '11px', lineHeight: 1 }}>Previous</Typography>
                        <Typography sx={{ color: '#888', fontSize: '11px', lineHeight: 1 }}>close</Typography>
                        <Typography sx={{ color: '#888', fontSize: '12px', fontWeight: 700 }}>{formatCurrency(prevPrice)}</Typography>
                    </Box>
                )}
            </Box>

            {/* Summary Stats Grid */}
            <Grid container spacing={4} sx={{ mt: 4, pt: 4, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <Grid item xs={6} sm={3}>
                    <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 1, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ color: '#888', fontSize: '14px' }}>Open</Typography>
                        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{formatCurrency(asset.openPrice || currentPrice)}</Typography>
                    </Box>
                    <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 1, mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ color: '#888', fontSize: '14px' }}>High</Typography>
                        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{formatCurrency(asset.high || currentPrice)}</Typography>
                    </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 1, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ color: '#888', fontSize: '14px' }}>Mkt cap</Typography>
                        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{asset.marketCap || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 1, mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ color: '#888', fontSize: '14px' }}>P/E ratio</Typography>
                        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{asset.peRatio || 'N/A'}</Typography>
                    </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 1, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ color: '#888', fontSize: '14px' }}>Avg Volume</Typography>
                        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{asset.avgVolume || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 1, mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ color: '#888', fontSize: '14px' }}>52-wk high</Typography>
                        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{formatCurrency(asset.yearHigh || currentPrice)}</Typography>
                    </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 1, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ color: '#888', fontSize: '14px' }}>Dividend yield</Typography>
                        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{asset.dividendYield ? `${asset.dividendYield}%` : 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 1, mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ color: '#888', fontSize: '14px' }}>52-wk low</Typography>
                        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{formatCurrency(asset.yearLow || currentPrice)}</Typography>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    )
}
