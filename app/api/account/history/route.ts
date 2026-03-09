import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { getPayments } from '@/lib/paymentStore'
import { getUserTrades } from '@/lib/tradingStore'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthUserId(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payments = getPayments(userId)
        const trades = getUserTrades(userId)

        return NextResponse.json({
            payments,
            trades
        })
    } catch (error: any) {
        console.error('Error fetching history:', error)
        return NextResponse.json({ error: error?.message || 'Failed to fetch history' }, { status: 500 })
    }
}
