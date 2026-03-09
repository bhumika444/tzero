'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton } from '@mui/material'
import { ExpandMore, ExpandLess } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import InvestmentLookupIllustration from './InvestmentLookupIllustration'
import InvestmentCard from './InvestmentCard'
import styles from './InvestmentsSection.module.css'

interface Investment {
  id: string
  asset_id: string
  asset_type: string
  asset_title: string
  amount: number
  currency: string
  payment_method_type: string
  payment_status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  created_at: string
}

interface InvestmentsSectionProps {
  isPositionsExpanded?: boolean
  onTogglePositions?: () => void
}

export default function InvestmentsSection({
  isPositionsExpanded = false,
  onTogglePositions,
}: InvestmentsSectionProps) {
  const router = useRouter()
  const theme = useTheme()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [secondaryHoldings, setSecondaryHoldings] = useState<any[]>([])
  const [secondaryTrades, setSecondaryTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvestments()
  }, [])

  const fetchInvestments = async () => {
    try {
      const response = await fetch('/api/investments')
      if (response.ok) {
        const data = await response.json()
        setInvestments(data.investments || [])
        setSecondaryHoldings(data.secondaryHoldings || [])
        setSecondaryTrades(data.secondaryTrades || [])
      }
    } catch (error) {
      console.error('Error fetching investments:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasPositions = investments.length > 0 || secondaryHoldings.length > 0 || secondaryTrades.length > 0

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getPaymentMethodLabel = (type: string) => {
    switch (type) {
      case 'TZERO_BALANCE':
        return 'tZERO Balance'
      case 'ACH':
        return 'Bank Account'
      case 'CREDIT_CARD':
        return 'Credit Card'
      default:
        return type
    }
  }

  const secondaryTradingInvestments = investments.filter(
    (inv) => inv.asset_type === 'SECONDARY_TRADING'
  )

  if (loading) {
    return (
      <Box className={styles.investmentsSection}>
        <Typography variant="h6" className={styles.sectionTitle}>
          MY POSITIONS
        </Typography>
        <Paper className={styles.investmentsCard}>
          <Typography variant="body2" sx={{ color: '#888888', textAlign: 'center', py: 4 }}>
            Loading investments...
          </Typography>
        </Paper>
      </Box>
    )
  }

  if (!hasPositions) {
    return (
      <Box className={styles.investmentsSection}>
        <Typography variant="h6" className={styles.sectionTitle}>
          MY POSITIONS
        </Typography>
        <Paper className={styles.investmentsCard}>
          <Box className={styles.illustrationContainer}>
            <InvestmentLookupIllustration />
          </Box>
          <Typography variant="h6" className={styles.investmentsTitle}>
            Let&apos;s find your first investment!
          </Typography>
          <Button
            variant="contained"
            className={styles.exploreButton}
            onClick={() => router.push('/investing/secondary-trading')}
          >
            Explore Opportunities
          </Button>
        </Paper>
      </Box>
    )
  }

  return (
    <Box className={styles.investmentsSection}>
      {/* My Positions Section - Collapsible */}
      {hasPositions && (
        <Paper className={styles.collapsibleSection}>
          <Box
            className={styles.sectionHeader}
            onClick={onTogglePositions}
            sx={{ cursor: onTogglePositions ? 'pointer' : 'default' }}
          >
            <Typography variant="h6" className={styles.categoryTitle}>
              My Positions
            </Typography>
            <IconButton size="small" sx={{ color: '#ffffff' }}>
              {isPositionsExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>

          {isPositionsExpanded && (
            <Box className={styles.tableContainer}>
              {/* Secondary Market Holdings */}
              {secondaryHoldings.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '13px' }}>
                    Active Holdings (Secondary Market)
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: '#888888', fontWeight: 600, borderColor: 'rgba(255, 255, 255, 0.1)' }}>Symbol</TableCell>
                          <TableCell sx={{ color: '#888888', fontWeight: 600, borderColor: 'rgba(255, 255, 255, 0.1)' }}>Shares</TableCell>
                          <TableCell sx={{ color: '#888888', fontWeight: 600, borderColor: 'rgba(255, 255, 255, 0.1)' }}>Avg Cost</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {secondaryHoldings.map((holding, i) => (
                          <TableRow key={i} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)' }, cursor: 'pointer' }} onClick={() => {
                            // Find the asset ID if possible to navigate
                            router.push(`/investing/secondary-trading`)
                          }}>
                            <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.1)', fontWeight: 700 }}>{holding.symbol}</TableCell>
                            <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.1)' }}>{holding.shares}</TableCell>
                            <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.1)' }}>{formatCurrency(holding.avg_cost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Transactions History */}
              {secondaryTrades.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ color: '#888888', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '13px' }}>
                    Marketplace Activity
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: '#888888', fontWeight: 600, borderColor: 'rgba(255, 255, 255, 0.1)' }}>Side</TableCell>
                          <TableCell sx={{ color: '#888888', fontWeight: 600, borderColor: 'rgba(255, 255, 255, 0.1)' }}>Asset</TableCell>
                          <TableCell sx={{ color: '#888888', fontWeight: 600, borderColor: 'rgba(255, 255, 255, 0.1)' }}>Price</TableCell>
                          <TableCell sx={{ color: '#888888', fontWeight: 600, borderColor: 'rgba(255, 255, 255, 0.1)' }}>Qty</TableCell>
                          <TableCell sx={{ color: '#888888', fontWeight: 600, borderColor: 'rgba(255, 255, 255, 0.1)' }}>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {secondaryTrades.map((trade) => (
                          <TableRow key={trade.id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)' } }}>
                            <TableCell sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                              <Chip
                                label={trade.side.toUpperCase()}
                                size="small"
                                color={trade.side === 'buy' ? 'primary' : 'secondary'}
                                sx={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  height: 20,
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>{trade.symbol}</TableCell>
                            <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.1)' }}>{formatCurrency(trade.price)}</TableCell>
                            <TableCell sx={{ color: '#888888', borderColor: 'rgba(255, 255, 255, 0.1)' }}>{trade.quantity}</TableCell>
                            <TableCell sx={{ color: '#888888', borderColor: 'rgba(255, 255, 255, 0.1)' }}>{formatDate(trade.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      )}

    </Box>
  )
}
