import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'
import { createOrder, cancelOrder, getUserOrders } from '@/lib/tradingStore'

export const dynamic = 'force-dynamic'

/**
 * GET /api/trading/orders
 * Returns orders for the current user
 */
export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthUserId(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const symbol = request.nextUrl.searchParams.get('symbol') || undefined
        const orders = getUserOrders(userId, symbol)

        return NextResponse.json(orders)
    } catch (error: any) {
        console.error('Error fetching orders:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to fetch orders' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthUserId(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { symbol, side, quantity, price, timeInForce } = await request.json()

        if (!symbol || !side || quantity === undefined || price === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const numQty = Number(quantity);
        const numPrice = Number(price);

        if (isNaN(numQty) || numQty <= 0) {
            return NextResponse.json({ error: 'Quantity must be a positive number greater than 0' }, { status: 400 })
        }

        if (isNaN(numPrice) || numPrice <= 0) {
            return NextResponse.json({ error: 'Price must be a positive number greater than 0' }, { status: 400 })
        }

        const order = createOrder(userId, symbol, side, numQty, numPrice, timeInForce)

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
 * Cancel an order (body-based)
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
