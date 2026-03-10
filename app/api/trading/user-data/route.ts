import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { getUserBalance, getUserHoldings, getUserOrders, getGlobalTrades } from '@/lib/tradingStore'
import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'

export const dynamic = 'force-dynamic'

/**
 * GET /api/trading/user-data
 * Returns the current user's balance, holdings, and order history.
 */
export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthUserId(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const symbol = request.nextUrl.searchParams.get('symbol') || undefined

        const balance = getUserBalance(userId)
        const holdings = getUserHoldings(userId)
        const orders = getUserOrders(userId, symbol)

        let marketHistory = []
        if (symbol) {
            marketHistory = getGlobalTrades(symbol)
            // If DB trades are empty, use JSON template as initial seed (as per user's prompt)
            if (marketHistory.length === 0) {
                marketHistory = secondaryTradingAssets.templates.marketHistory.map(t => ({
                    ...t,
                    isPlaceholder: true
                }))
            }
        }

        return NextResponse.json({
            balance,
            holdings,
            orders,
            marketHistory
        })
    } catch (error: any) {
        console.error('Error fetching user trading data:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to fetch user data' },
            { status: 500 }
        )
    }
}
