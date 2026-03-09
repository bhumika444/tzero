import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { createOrder, cancelOrder } from '@/lib/tradingStore'

export const dynamic = 'force-dynamic'

/**
 * GET /api/trading/orders
 * Returns orders (redundant with user-data, but useful for a standard API)
 */
export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthUserId(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { symbol, side, quantity, price, timeInForce } = await request.json()

        if (!symbol || !side || !quantity || !price) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const order = createOrder(userId, symbol, side, Number(quantity), Number(price), timeInForce)

        return NextResponse.json(order)
    } catch (error: any) {
        console.error('Error creating order:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to create order' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/trading/orders
 * Cancel an order
 */
export async function DELETE(request: NextRequest) {
    try {
        const userId = await getAuthUserId(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { orderId } = await request.json()
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
