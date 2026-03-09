'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Divider,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  alpha,
  Stack,
  IconButton,
  Chip
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrowBack, TrendingUp, TrendingDown, ReceiptLong, AccountBalanceWallet, Cancel } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, getSecondaryTradingSymbol, slugify, getSeededColor } from '@/lib/investmentUtils'
import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'
import api from '@/lib/api'

interface Order {
  id: string
  side: 'buy' | 'sell'
  quantity: number
  remaining_quantity: number
  price: number
  status: string
  created_at: string
}

interface Holding {
  symbol: string
  shares: number
  avg_cost: number
}

interface UserData {
  balance: number
  holdings: Holding[]
  orders: Order[]
}

export default function SecondaryTradingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const theme = useTheme()
  const { user, isAuthenticated } = useAuth()

  const investmentSlug = Array.isArray(params.id) ? params.id[0] : params.id
  const decodedSlug = investmentSlug ? decodeURIComponent(investmentSlug) : ''
  const allAssets = secondaryTradingAssets.investments as any[]
  const asset = allAssets.find((a) => a.id === decodedSlug || slugify(a.title) === decodedSlug)

  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Order Form State
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [quantity, setQuantity] = useState('10')
  const [price, setPrice] = useState(asset?.currentValue?.toString() || '0')

  const fetchUserData = async () => {
    if (!asset) return
    try {
      const symbol = getSecondaryTradingSymbol(asset.title, asset.symbol)
      const { data } = await api.get(`/trading/user-data?symbol=${symbol}`)
      setUserData(data)
    } catch (err: any) {
      console.error('Error fetching user data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, asset])

  if (!asset) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#000000' }}>
        <Header />
        <Container maxWidth="lg" sx={{ pt: '120px', textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: '#ffffff' }}>Asset not found</Typography>
          <Button onClick={() => router.push('/investing/secondary-trading')} sx={{ mt: 2, color: theme.palette.primary.main }}>
            Back to Marketplace
          </Button>
        </Container>
      </Box>
    )
  }

  const symbol = getSecondaryTradingSymbol(asset.title, asset.symbol)
  const currentHolding = userData?.holdings.find(h => h.symbol === symbol)

  const handlePlaceOrder = async () => {
    setError(null)
    setSubmitting(true)
    try {
      await api.post('/trading/orders', {
        symbol,
        side,
        quantity: Number(quantity),
        price: Number(price),
        timeInForce: 'day'
      })
      await fetchUserData()
      // Reset form or show success
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      await api.delete('/trading/orders', { data: { orderId } })
      await fetchUserData()
    } catch (err: any) {
      console.error('Failed to cancel order:', err)
    }
  }

  // --- Chart Logic (Simple SVG Line Chart) ---
  const chartHeight = 200
  const chartWidth = 800
  const prices = asset.dailyHistory.map((d: any) => d.close)
  const maxPrice = Math.max(...prices) * 1.02
  const minPrice = Math.min(...prices) * 0.98
  const range = maxPrice - minPrice

  const points = prices.map((p: number, i: number) => {
    const x = (i / (prices.length - 1)) * chartWidth
    const y = chartHeight - ((p - minPrice) / range) * chartHeight
    return `${x},${y}`
  }).join(' ')

  // --- Order Book Data ---
  const orderBook = secondaryTradingAssets.templates.orderBook
  const asks = [...orderBook.asks].sort((a, b) => b.priceMultiplier - a.priceMultiplier)
  const bids = [...orderBook.bids].sort((a, b) => b.priceMultiplier - a.priceMultiplier)

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#000000' }}>
      <Header />

      <Container maxWidth="lg" sx={{ pt: { xs: '100px', sm: '120px' }, pb: 8 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/investing/secondary-trading')}
          sx={{ color: '#888888', mb: 3, textTransform: 'none', '&:hover': { color: '#ffffff' } }}
        >
          Back to Marketplace
        </Button>

        {/* Asset Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: '18px',
              backgroundColor: alpha(getSeededColor(symbol), 0.15),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${alpha(getSeededColor(symbol), 0.2)}`,
            }}>
              <Typography sx={{ color: getSeededColor(symbol), fontWeight: 800, fontSize: '24px' }}>
                {symbol.slice(0, 2)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#ffffff', mb: 0.5, letterSpacing: '-0.02em' }}>
                {asset.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ color: '#888888', fontWeight: 600, letterSpacing: '0.05em' }}>{symbol}</Typography>
                <Chip label={asset.category} size="small" sx={{
                  backgroundColor: 'rgba(255,255,255,0.05)', color: '#888', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', borderRadius: '4px'
                }} />
              </Box>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#ffffff', mb: 0.5 }}>
              {formatCurrency(asset.currentValue)}
            </Typography>
            <Typography sx={{
              color: asset.isPositive ? theme.palette.primary.main : '#ff4d4d',
              fontWeight: 700, fontSize: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5
            }}>
              {asset.isPositive ? <TrendingUp /> : <TrendingDown />}
              {asset.isPositive ? '+' : ''}{asset.performancePercent.toFixed(2)}%
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* Left Column (Chart, Order Book, Position) */}
          <Grid item xs={12} md={8}>
            {/* Price Chart */}
            <Paper elevation={0} sx={{
              p: 4, mb: 4, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px'
            }}>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700, mb: 3 }}>Performance History</Typography>
              <Box sx={{ width: '100%', height: chartHeight + 40, mt: 2, position: 'relative' }}>
                {/* Simplified SVG Chart */}
                <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity="0.2" />
                      <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M 0,${chartHeight} L ${points} L ${chartWidth},${chartHeight} Z`}
                    fill="url(#chartGradient)"
                  />
                  <polyline
                    fill="none"
                    stroke={theme.palette.primary.main}
                    strokeWidth="3"
                    points={points}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography sx={{ color: '#444', fontSize: '12px', fontWeight: 600 }}>Dec 16</Typography>
                  <Typography sx={{ color: '#444', fontSize: '12px', fontWeight: 600 }}>Jan 14</Typography>
                </Box>
              </Box>
            </Paper>

            {/* Order Book */}
            <Paper elevation={0} sx={{
              p: 4, mb: 4, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px'
            }}>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700, mb: 3 }}>Order Book</Typography>
              <Grid container spacing={4}>
                <Grid item xs={6}>
                  <Typography sx={{ color: '#ff4d4d', fontWeight: 700, mb: 2, fontSize: '14px', letterSpacing: '0.05em' }}>SELL ORDERS (ASKS)</Typography>
                  {asks.map((ask, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, position: 'relative' }}>
                      <Box sx={{ position: 'absolute', right: 0, top: 4, height: 24, backgroundColor: 'rgba(255, 77, 77, 0.05)', width: `${(ask.size / 2000) * 100}%`, borderRadius: '4px' }} />
                      <Typography sx={{ color: '#ff4d4d', fontSize: '14px', fontWeight: 600, zIndex: 1 }}>{formatCurrency(ask.priceMultiplier * asset.basePrice)}</Typography>
                      <Typography sx={{ color: '#ffffff', fontSize: '14px', fontWeight: 500, zIndex: 1 }}>{ask.size}</Typography>
                    </Box>
                  ))}
                </Grid>
                <Grid item xs={6}>
                  <Typography sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 2, fontSize: '14px', letterSpacing: '0.05em' }}>BUY ORDERS (BIDS)</Typography>
                  {bids.map((bid, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, position: 'relative' }}>
                      <Box sx={{ position: 'absolute', left: 0, top: 4, height: 24, backgroundColor: 'rgba(0, 255, 136, 0.05)', width: `${(bid.size / 2000) * 100}%`, borderRadius: '4px' }} />
                      <Typography sx={{ color: theme.palette.primary.main, fontSize: '14px', fontWeight: 600, zIndex: 1 }}>{formatCurrency(bid.priceMultiplier * asset.basePrice)}</Typography>
                      <Typography sx={{ color: '#ffffff', fontSize: '14px', fontWeight: 500, zIndex: 1 }}>{bid.size}</Typography>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </Paper>

            {/* User Portfolio Info */}
            {isAuthenticated && (
              <Paper elevation={0} sx={{
                p: 4, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px'
              }}>
                <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700, mb: 3 }}>Your Position & Orders</Typography>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <ReceiptLong sx={{ color: theme.palette.primary.main, fontSize: '20px' }} />
                        <Typography sx={{ color: '#888', fontWeight: 600, fontSize: '13px' }}>SHARES OWNED</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 800 }}>{currentHolding?.shares || 0}</Typography>
                      <Typography sx={{ color: '#555', fontSize: '12px' }}>Avg Cost: {formatCurrency(currentHolding?.avg_cost || 0)}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AccountBalanceWallet sx={{ color: theme.palette.primary.main, fontSize: '20px' }} />
                        <Typography sx={{ color: '#888', fontWeight: 600, fontSize: '13px' }}>UNSETTLED CASH</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 800 }}>{formatCurrency(userData?.balance || 0)}</Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Typography sx={{ color: '#ffffff', fontWeight: 700, mb: 2, fontSize: '14px' }}>ORDER HISTORY</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#555', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>SIDE</TableCell>
                        <TableCell sx={{ color: '#555', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>QTY</TableCell>
                        <TableCell sx={{ color: '#555', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>PRICE</TableCell>
                        <TableCell sx={{ color: '#555', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>STATUS</TableCell>
                        <TableCell sx={{ color: '#555', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userData?.orders.slice(0, 5).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: order.side === 'buy' ? theme.palette.primary.main : '#ff4d4d', fontWeight: 700, textTransform: 'uppercase' }}>{order.side}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ffffff' }}>{order.quantity}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ffffff' }}>{formatCurrency(order.price)}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#888' }}>
                            <Chip label={order.status} size="small" sx={{ height: '20px', fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.05)', color: '#888' }} />
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>
                            {(order.status === 'New' || order.status === 'Pending' || order.status === 'PartiallyFilled') && (
                              <IconButton size="small" onClick={() => handleCancelOrder(order.id)} sx={{ color: '#ff4d4d' }}>
                                <Cancel fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!userData?.orders || userData.orders.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3, color: '#444', borderBottom: 'none' }}>No recent orders</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </Grid>

          {/* Right Column (Order Form) */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{
              p: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(0, 255, 136, 0.15)',
              borderRadius: '24px',
              position: { md: 'sticky' },
              top: { md: 100 },
              boxShadow: `0 20px 40px -20px ${alpha(theme.palette.primary.main, 0.1)}`
            }}>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700, mb: 3 }}>Trade Asset</Typography>

              <ToggleButtonGroup
                value={side}
                exclusive
                onChange={(_, val) => val && setSide(val)}
                fullWidth
                sx={{ mb: 3, backgroundColor: 'rgba(0,0,0,0.3)', p: 0.5, borderRadius: '12px' }}
              >
                <ToggleButton value="buy" sx={{
                  borderRadius: '10px !important', color: side === 'buy' ? '#000' : '#888', border: 'none !important',
                  backgroundColor: side === 'buy' ? theme.palette.primary.main : 'transparent',
                  '&:hover': { backgroundColor: side === 'buy' ? theme.palette.primary.main : 'rgba(255,255,255,0.05)' },
                  fontWeight: 700
                }}>BUY</ToggleButton>
                <ToggleButton value="sell" sx={{
                  borderRadius: '10px !important', color: side === 'sell' ? '#fff' : '#888', border: 'none !important',
                  backgroundColor: side === 'sell' ? '#ff4d4d' : 'transparent',
                  '&:hover': { backgroundColor: side === 'sell' ? '#ff4d4d' : 'rgba(255,255,255,0.05)' },
                  fontWeight: 700
                }}>SELL</ToggleButton>
              </ToggleButtonGroup>

              <Stack spacing={3}>
                <Box>
                  <Typography sx={{ color: '#888', fontSize: '12px', fontWeight: 700, mb: 1 }}>QUANTITY</Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        color: '#fff',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }
                      }
                    }}
                  />
                </Box>
                <Box>
                  <Typography sx={{ color: '#888', fontSize: '12px', fontWeight: 700, mb: 1 }}>LIMIT PRICE (USD)</Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        color: '#fff',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }
                      }
                    }}
                  />
                </Box>

                <Box sx={{ py: 2, borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: '#888', fontSize: '13px' }}>Estimated Total</Typography>
                    <Typography sx={{ color: '#fff', fontWeight: 700 }}>{formatCurrency(Number(quantity) * Number(price))}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: '#888', fontSize: '13px' }}>Available Balance</Typography>
                    <Typography sx={{ color: '#fff', fontWeight: 700 }}>{formatCurrency(userData?.balance || 0)}</Typography>
                  </Box>
                </Box>

                {error && <Alert severity="error" sx={{ borderRadius: '12px', backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ff8a80' }}>{error}</Alert>}

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={submitting || !isAuthenticated}
                  onClick={handlePlaceOrder}
                  sx={{
                    height: '56px', borderRadius: '16px', fontWeight: 800, fontSize: '16px',
                    backgroundColor: side === 'buy' ? theme.palette.primary.main : '#ff4d4d',
                    color: side === 'buy' ? '#000' : '#fff',
                    '&:hover': { backgroundColor: side === 'buy' ? alpha(theme.palette.primary.main, 0.8) : alpha('#ff4d4d', 0.8) },
                    '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.05)', color: '#444' }
                  }}
                >
                  {submitting ? <CircularProgress size={24} color="inherit" /> : (!isAuthenticated ? 'Sign In to Trade' : `PLACE ${side.toUpperCase()} ORDER`)}
                </Button>

                {!isAuthenticated && (
                  <Button onClick={() => router.push('/auth/signin')} sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>
                    Sign In / Create Account
                  </Button>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

