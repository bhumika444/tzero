import db from './db'
import { randomUUID } from 'crypto'
import { matchOrder } from './matchingEngine'

export interface TradingOrder {
    id: string
    user_id: string
    symbol: string
    side: 'buy' | 'sell'
    quantity: number
    remaining_quantity: number
    price: number
    status: string
    time_in_force: string
    good_til_date: string | null
    created_at: string
    updated_at: string
}

export interface TradingHolding {
    id: string
    user_id: string
    symbol: string
    shares: number
    avg_cost: number
    created_at: string
    updated_at: string
}

export interface TradingBalance {
    id: string
    user_id: string
    cash_balance: number
    created_at: string
    updated_at: string
}

export function getUserBalance(userId: string): number {
    const row = db.prepare('SELECT cash_balance FROM trading_balances WHERE user_id = ?').get(userId) as { cash_balance: number } | undefined
    if (!row) {
        // If no balance exists, seed it with $1,000 as per instructions
        const id = `bal_${randomUUID()}`
        db.prepare('INSERT INTO trading_balances (id, user_id, cash_balance) VALUES (?, ?, ?)').run(id, userId, 1000.00)
        return 1000.00
    }
    return row.cash_balance
}

export function updateUserBalance(userId: string, amount: number) {
    db.prepare('UPDATE trading_balances SET cash_balance = cash_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(amount, userId)
}

export function getUserHoldings(userId: string): TradingHolding[] {
    return db.prepare('SELECT * FROM trading_holdings WHERE user_id = ?').all(userId) as TradingHolding[]
}

export function getUserTrades(userId: string) {
    return db.prepare(`
        SELECT t.*, 
               CASE WHEN t.buy_order_id IN (SELECT id FROM trading_orders WHERE user_id = ?) THEN 'buy' ELSE 'sell' END as side
        FROM trading_trades t
        JOIN trading_orders bo ON t.buy_order_id = bo.id
        JOIN trading_orders so ON t.sell_order_id = so.id
        WHERE bo.user_id = ? OR so.user_id = ?
        ORDER BY t.created_at DESC
    `).all(userId, userId, userId)
}

export function getUserOrders(userId: string, symbol?: string): TradingOrder[] {
    if (symbol) {
        return db.prepare('SELECT * FROM trading_orders WHERE user_id = ? AND symbol = ? ORDER BY created_at DESC').all(userId, symbol) as TradingOrder[]
    }
    return db.prepare('SELECT * FROM trading_orders WHERE user_id = ? ORDER BY created_at DESC').all(userId) as TradingOrder[]
}

export function getGlobalTrades(symbol: string, limit: number = 10) {
    return db.prepare(`
        SELECT * FROM trading_trades 
        WHERE symbol = ? 
        ORDER BY created_at DESC 
        LIMIT ?
    `).all(symbol, limit) as any[]
}

export function createOrder(
    userId: string,
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    price: number,
    timeInForce: string = 'day'
) {
    return db.transaction(() => {
        const sideLower = side.toLowerCase() as 'buy' | 'sell'
        const balance = getUserBalance(userId)
        const holdings = getUserHoldings(userId)
        const assetHolding = holdings.find(h => h.symbol === symbol)

        // Validation
        if (sideLower === 'buy') {
            const totalCost = quantity * price
            if (balance < totalCost) {
                throw new Error(`Insufficient funds. Required: ${totalCost}, Available: ${balance}`)
            }
            // Reserve funds
            updateUserBalance(userId, -totalCost)
        } else {
            if (!assetHolding || assetHolding.shares < quantity) {
                throw new Error(`Insufficient shares. Required: ${quantity}, Available: ${assetHolding?.shares || 0}`)
            }
            // DEBIT shares immediately to prevent double-selling
            db.prepare('UPDATE trading_holdings SET shares = shares - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND symbol = ?').run(quantity, userId, symbol)
        }

        const orderId = `ord_${randomUUID()}`
        const result = matchOrder(orderId, userId, symbol, sideLower, quantity, price, timeInForce)

        return result
    })()
}

export function cancelOrder(userId: string, orderId: string) {
    const order = db.prepare('SELECT * FROM trading_orders WHERE id = ? AND user_id = ?').get(orderId, userId) as TradingOrder | undefined
    if (!order) throw new Error('Order not found')
    if (order.status === 'Completed' || order.status === 'Cancelled') throw new Error('Order cannot be cancelled')

    db.prepare("UPDATE trading_orders SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(orderId)

    // If it was a buy order, refund the remaining funds
    if (order.side === 'buy') {
        const refundAmount = order.remaining_quantity * order.price
        updateUserBalance(userId, refundAmount)
    } else {
        // Refund shares for Sell orders
        db.prepare('UPDATE trading_holdings SET shares = shares + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND symbol = ?').run(order.remaining_quantity, userId, order.symbol)
    }

    return { success: true }
}
