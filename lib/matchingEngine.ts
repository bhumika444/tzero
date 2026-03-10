import crypto from 'crypto'
import db from '@/lib/db'

export function upsertHolding(userId: string, symbol: string, deltaShares: number, price: number) {
  const holding = db.prepare('SELECT shares, avg_cost FROM trading_holdings WHERE user_id = ? AND symbol = ?').get(userId, symbol) as
    | { shares: number; avg_cost: number }
    | undefined

  if (!holding) {
    db.prepare(
      `INSERT INTO trading_holdings (id, user_id, symbol, shares, avg_cost, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(crypto.randomUUID(), userId, symbol, deltaShares, price)
    return
  }

  const newShares = holding.shares + deltaShares
  if (newShares <= 0) {
    db.prepare('DELETE FROM trading_holdings WHERE user_id = ? AND symbol = ?').run(userId, symbol)
    return
  }

  let avgCost = holding.avg_cost
  if (deltaShares > 0) {
    const totalCost = holding.avg_cost * holding.shares + deltaShares * price
    avgCost = totalCost / newShares
  }

  db.prepare(
    `UPDATE trading_holdings
     SET shares = ?, avg_cost = ?, updated_at = datetime('now')
     WHERE user_id = ? AND symbol = ?`
  ).run(newShares, avgCost, userId, symbol)
}

export function matchOrder(
  orderId: string,
  userId: string,
  symbol: string,
  side: 'buy' | 'sell',
  quantity: number,
  price: number,
  timeInForce: string,
  goodTilDate: string | null = null
) {
  const now = new Date().toISOString()

  const insertOrder = db.prepare(
    `INSERT INTO trading_orders
     (id, user_id, symbol, side, quantity, remaining_quantity, price, status, time_in_force, good_til_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const updateOrder = db.prepare(
    `UPDATE trading_orders
     SET remaining_quantity = ?, status = ?, updated_at = ?
     WHERE id = ?`
  )
  const insertTrade = db.prepare(
    `INSERT INTO trading_trades (id, buy_order_id, sell_order_id, symbol, quantity, price, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )

  const matchQuery =
    side === 'buy'
      ? `SELECT * FROM trading_orders
         WHERE symbol = ? AND side = 'sell' AND status IN ('New', 'Pending', 'PartiallyFilled')
         AND price <= ?
         ORDER BY price ASC, created_at ASC`
      : `SELECT * FROM trading_orders
         WHERE symbol = ? AND side = 'buy' AND status IN ('New', 'Pending', 'PartiallyFilled')
         AND price >= ?
         ORDER BY price DESC, created_at ASC`

  const matchOrders = db.prepare(matchQuery)

  return db.transaction(() => {
    insertOrder.run(orderId, userId, symbol, side, quantity, quantity, price, 'New', timeInForce, goodTilDate, now, now)

    let remaining = quantity
    const matches = matchOrders.all(symbol, price) as Array<any>

    for (const match of matches) {
      if (remaining <= 0) break
      const matchRemaining = Number(match.remaining_quantity)
      if (matchRemaining <= 0) continue

      const fillQty = Math.min(remaining, matchRemaining)
      const tradePrice = Number(match.price)

      const buyOrderId = side === 'buy' ? orderId : match.id
      const sellOrderId = side === 'sell' ? orderId : match.id

      insertTrade.run(crypto.randomUUID(), buyOrderId, sellOrderId, symbol, fillQty, tradePrice, new Date().toISOString())

      const newMatchRemaining = matchRemaining - fillQty
      const matchStatus = newMatchRemaining === 0 ? 'Completed' : 'PartiallyFilled'
      updateOrder.run(newMatchRemaining, matchStatus, new Date().toISOString(), match.id)

      const buyerId = side === 'buy' ? userId : match.user_id
      const sellerId = side === 'sell' ? userId : match.user_id

      // Buyer always receives shares
      upsertHolding(buyerId, symbol, fillQty, tradePrice)

      // NOTE: Seller's shares were already subtracted in createOrder() to reserve them.
      // We do NOT subtract them again here.

      // Cash Balance Transfers
      const totalTradeValue = fillQty * tradePrice

      // Seller receives cash
      db.prepare('UPDATE trading_balances SET cash_balance = cash_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
        .run(totalTradeValue, sellerId)

      // Buyer refund logic (if tradePrice < their limit price)
      const buyerLimitPrice = side === 'buy' ? price : Number(match.price)
      if (tradePrice < buyerLimitPrice) {
        const refundPerShare = buyerLimitPrice - tradePrice
        const totalRefund = fillQty * refundPerShare
        db.prepare('UPDATE trading_balances SET cash_balance = cash_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
          .run(totalRefund, buyerId)
      }

      remaining -= fillQty
    }

    let status = 'Pending'
    if (remaining === 0) {
      status = 'Completed'
    } else if (remaining < quantity) {
      status = 'PartiallyFilled'
    }

    updateOrder.run(remaining, status, new Date().toISOString(), orderId)

    return { orderId, status, remaining }
  })()
}
