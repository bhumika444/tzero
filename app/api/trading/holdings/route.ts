import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { getUserHoldings } from '@/lib/tradingStore'

export const dynamic = 'force-dynamic'

/**
 * GET /api/trading/holdings
 * Returns the current user's holdings.
 */
export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthUserId(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const holdings = getUserHoldings(userId)

        return NextResponse.json(holdings)
    } catch (error: any) {
        console.error('Error fetching holdings:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to fetch holdings' },
            { status: 500 }
        )
    }
}
