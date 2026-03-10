import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { cancelOrder } from '@/lib/tradingStore'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/trading/orders/[id]
 * Cancel an order using path parameter
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = await getAuthUserId(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const orderId = params.id
        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
        }

        const result = cancelOrder(userId, orderId)
        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Error cancelling order:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to cancel order' },
            { status: 500 }
        )
    }
}
