'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  List,
  Typography,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material'
import {
  ArrowForward,
} from '@mui/icons-material'
import PortfolioSummaryCard from './PortfolioSummaryCard'
import InvestmentsSection from './InvestmentsSection'
import { useRouter } from 'next/navigation'
import styles from './CashBalance.module.css'

import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'

interface Investment {
  id: string
  amount: number
  payment_status: string
}

interface SecondaryHolding {
  symbol: string
  shares: number
  avg_cost: number
}

export default function CashBalance() {
  const router = useRouter()
  const [cashAvailable, setCashAvailable] = useState(0)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [secondaryHoldings, setSecondaryHoldings] = useState<SecondaryHolding[]>([])
  const [loading, setLoading] = useState(true)
  const [isPositionsExpanded, setIsPositionsExpanded] = useState(false)

  const fetchBalances = async () => {
    try {
      const balanceResponse = await fetch('/api/banking/balance');

      if (balanceResponse.ok) {
        const data = await balanceResponse.json()
        setCashAvailable(Number(data.balance) || 0)
      }

    } catch (error) {
      console.error('Error fetching cash balance:', error)
    }
  }

  useEffect(() => {
    fetchInvestments()
    fetchBalances()
  }, [])

  const fetchInvestments = async () => {
    try {
      const response = await fetch('/api/investments')
      if (response.ok) {
        const data = await response.json()
        setInvestments(data.investments || [])
        setSecondaryHoldings(data.secondaryHoldings || [])
      }
    } catch (error) {
      console.error('Error fetching investments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate secondary market value
  const secondaryMarketValue = secondaryHoldings.reduce((sum, holding) => {
    const asset = secondaryTradingAssets.investments.find(a =>
      (a.symbol === holding.symbol) ||
      (holding.symbol.includes(a.symbol))
    )
    const currentPrice = asset?.currentValue || holding.avg_cost
    return sum + (holding.shares * currentPrice)
  }, 0)

  // Calculate portfolio values
  const investedAmount = investments
    .filter((inv) => inv.payment_status === 'COMPLETED')
    .reduce((sum, inv) => sum + inv.amount, 0) + secondaryMarketValue

  const portfolioValue = investedAmount + cashAvailable

  return (
    <Box className={styles.content}>
      {/* Portfolio Summary Section */}
      <PortfolioSummaryCard
        totalValue={portfolioValue}
        cashAvailable={cashAvailable}
        investedAmount={investedAmount}
        onInvestedClick={() => setIsPositionsExpanded(!isPositionsExpanded)}
      />

      {/* Investments Section */}
      <InvestmentsSection
        isPositionsExpanded={isPositionsExpanded}
        onTogglePositions={() => setIsPositionsExpanded(!isPositionsExpanded)}
      />

      {/* All History Section */}
      <Box className={styles.historySection}>
        <Typography variant="h6" className={styles.sectionTitle}>
          ALL HISTORY
        </Typography>
        <List className={styles.historyList}>
          <ListItem
            className={styles.historyItem}
            onClick={() => {
              router.push('/account/history')
            }}
          >
            <ListItemText
              primary="All Transactions"
              secondary="Past Transactions"
              className={styles.historyText}
            />
            <IconButton edge="end" className={styles.historyArrow}>
              <ArrowForward />
            </IconButton>
          </ListItem>
          <ListItem
            className={styles.historyItem}
            onClick={() => {
              router.push('/account/statements')
            }}
          >
            <ListItemText
              primary="All Documents"
              secondary="Account Statements, Tax Docs..."
              className={styles.historyText}
            />
            <IconButton edge="end" className={styles.historyArrow}>
              <ArrowForward />
            </IconButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  )
}
