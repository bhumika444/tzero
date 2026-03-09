import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { getUserBalance, getUserHoldings, getUserOrders } from '@/lib/tradingStore'

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

        return NextResponse.json({
            balance,
            holdings,
            orders,
        })
    } catch (error: any) {
        console.error('Error fetching user trading data:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to fetch user data' },
            { status: 500 }
        )
    }
}
