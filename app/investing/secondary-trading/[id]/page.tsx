'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
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
  Chip,
  MenuItem,
  Select,
  FormControl
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrowBack, TrendingUp, TrendingDown, ReceiptLong, AccountBalanceWallet, Cancel } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, getSecondaryTradingSymbol, slugify, getSeededColor } from '@/lib/investmentUtils'
import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'
import api from '@/lib/api'
import PriceChart from '@/components/investments/PriceChart'

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
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit')
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

  // Asset and price logic handle in the component

  // --- Order Book Data ---
  const orderBookTemplate = secondaryTradingAssets.templates.orderBook
  const asks = [...orderBookTemplate.asks].sort((a, b) => b.priceMultiplier - a.priceMultiplier)
  const bids = [...orderBookTemplate.bids].sort((a, b) => b.priceMultiplier - a.priceMultiplier)

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button variant="contained" sx={{
              borderRadius: '24px',
              backgroundColor: '#1a73e8',
              color: '#fff',
              fontWeight: 700,
              px: 3,
              '&:hover': { backgroundColor: '#1557b0' }
            }}>
              + Follow
            </Button>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* Left Column (Chart, Order Book, Position) */}
          <Grid item xs={12} md={8}>
            {/* Price Chart */}
            <Paper elevation={0} sx={{
              p: 4, mb: 4, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px'
            }}>
              <PriceChart asset={asset} />
            </Paper>

            {/* About / Company Description */}
            <Paper elevation={0} sx={{
              p: 4, mb: 4, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px'
            }}>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700, mb: 2 }}>About {asset.title}</Typography>
              <Typography sx={{ color: '#aaa', lineHeight: 1.8, fontSize: '15px', mb: 4 }}>
                {asset.companyDescription || "No description available for this asset."}
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 700, mb: 0.5, textTransform: 'uppercase' }}>Revenue</Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 600 }}>{asset.revenue || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 700, mb: 0.5, textTransform: 'uppercase' }}>Revenue Growth</Typography>
                  <Typography sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                    {asset.revenueGrowth ? `+${asset.revenueGrowth}%` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 700, mb: 0.5, textTransform: 'uppercase' }}>Net Income</Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 600 }}>{asset.netIncome || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 700, mb: 0.5, textTransform: 'uppercase' }}>Employees</Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 600 }}>{asset.employees || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 700, mb: 0.5, textTransform: 'uppercase' }}>Founded</Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 600 }}>{asset.founded || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 700, mb: 0.5, textTransform: 'uppercase' }}>Avg Volume</Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 600 }}>{asset.avgVolume || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 700, mb: 0.5, textTransform: 'uppercase' }}>Price Range</Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 600 }}>{asset.priceRange || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Order Book */}
            <Paper elevation={0} sx={{
              p: 4, mb: 4, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px'
            }}>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700, mb: 1 }}>Order Book</Typography>

              {/* Top Summary */}
              <Stack direction="row" spacing={4} sx={{ mb: 4, py: 2, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Box>
                  <Typography sx={{ color: '#888', fontSize: '11px', fontWeight: 700, mb: 0.5 }}>BEST BID</Typography>
                  <Typography sx={{ color: theme.palette.primary.main, fontWeight: 800, fontSize: '18px' }}>
                    {formatCurrency(bids[0].priceMultiplier * asset.basePrice)}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: '#888', fontSize: '11px', fontWeight: 700, mb: 0.5 }}>BEST ASK</Typography>
                  <Typography sx={{ color: '#ff4d4d', fontWeight: 800, fontSize: '18px' }}>
                    {formatCurrency(asks[asks.length - 1].priceMultiplier * asset.basePrice)}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: '#888', fontSize: '11px', fontWeight: 700, mb: 0.5 }}>SPREAD</Typography>
                  <Typography sx={{ color: '#ffffff', fontWeight: 800, fontSize: '18px' }}>
                    {formatCurrency((asks[asks.length - 1].priceMultiplier - bids[0].priceMultiplier) * asset.basePrice)}
                  </Typography>
                </Box>
              </Stack>

              <Grid container spacing={4}>
                <Grid item xs={6}>
                  <Typography sx={{ color: '#ff4d4d', fontWeight: 700, mb: 1, fontSize: '14px', letterSpacing: '0.05em' }}>SELL ORDERS (ASKS)</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 0.5 }}>
                    <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 700 }}>ASK PRICE</Typography>
                    <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 700 }}>QTY</Typography>
                  </Box>
                  {asks.map((ask, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, position: 'relative' }}>
                      <Box sx={{ position: 'absolute', right: 0, top: 4, height: 24, backgroundColor: 'rgba(255, 77, 77, 0.05)', width: `${(ask.size / 2000) * 100}%`, borderRadius: '4px' }} />
                      <Typography sx={{ color: '#ff4d4d', fontSize: '14px', fontWeight: 600, zIndex: 1 }}>{formatCurrency(ask.priceMultiplier * asset.basePrice)}</Typography>
                      <Typography sx={{ color: '#ffffff', fontSize: '14px', fontWeight: 500, zIndex: 1 }}>{ask.size}</Typography>
                    </Box>
                  ))}
                </Grid>
                <Grid item xs={6}>
                  <Typography sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 1, fontSize: '14px', letterSpacing: '0.05em' }}>BUY ORDERS (BIDS)</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 0.5 }}>
                    <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 700 }}>BID PRICE</Typography>
                    <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 700 }}>QTY</Typography>
                  </Box>
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

            {/* Recent Trades / Market Activity */}
            <Paper elevation={0} sx={{
              p: 4, mb: 4, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px'
            }}>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700, mb: 1 }}>Recent Trades</Typography>
              <Typography sx={{ color: '#555', fontSize: '13px', mb: 3 }}>Market Activity</Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 0.5 }}>
                <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 700, flex: 1 }}>PRICE</Typography>
                <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 700, flex: 1, textAlign: 'center' }}>QUANTITY</Typography>
                <Typography sx={{ color: '#555', fontSize: '11px', fontWeight: 700, flex: 1, textAlign: 'right' }}>TIME</Typography>
              </Box>

              {(secondaryTradingAssets.templates.marketHistory || []).map((trade, i) => {
                const isTradePositive = trade.priceMultiplier >= 1.0
                return (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: i === 9 ? 'none' : '1px solid rgba(255,255,255,0.02)' }}>
                    <Typography sx={{ color: isTradePositive ? theme.palette.primary.main : '#ff4d4d', fontSize: '14px', fontWeight: 600, flex: 1 }}>
                      {formatCurrency(trade.priceMultiplier * asset.basePrice)}
                    </Typography>
                    <Typography sx={{ color: '#ffffff', fontSize: '14px', fontWeight: 500, flex: 1, textAlign: 'center' }}>
                      {trade.qty}
                    </Typography>
                    <Typography sx={{ color: '#888', fontSize: '13px', flex: 1, textAlign: 'right' }}>
                      {trade.time}
                    </Typography>
                  </Box>
                )
              })}
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
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                        <Typography sx={{ color: '#555', fontSize: '12px' }}>Avg Cost: {formatCurrency(currentHolding?.shares ? currentHolding.avg_cost : 0)}</Typography>
                        <Typography sx={{ color: '#555', fontSize: '12px' }}>Market Value: {formatCurrency((currentHolding?.shares || 0) * (asset?.currentValue || 0))}</Typography>
                      </Box>
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
                        <TableCell sx={{ color: '#555', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>TIME</TableCell>
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
                            <Chip
                              label={order.status === 'PartiallyFilled'
                                ? `Partially Filled (${order.quantity - order.remaining_quantity}/${order.quantity})`
                                : order.status}
                              size="small"
                              sx={{ height: '20px', fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.05)', color: '#888' }}
                            />
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#888', fontSize: '11px' }}>
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                          <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3, color: '#444', borderBottom: 'none' }}>No recent orders</TableCell>
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
                  <Typography sx={{ color: '#888', fontSize: '12px', fontWeight: 700, mb: 1 }}>ORDER TYPE</Typography>
                  <FormControl fullWidth>
                    <Select
                      value={orderType}
                      onChange={(e) => {
                        const val = e.target.value as 'limit' | 'market'
                        setOrderType(val)
                        if (val === 'market') {
                          setPrice(asset?.currentValue?.toString() || '0')
                        }
                      }}
                      sx={{
                        borderRadius: '12px',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        color: '#fff',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main }
                      }}
                    >
                      <MenuItem value="limit">Limit Order</MenuItem>
                      <MenuItem value="market">Market Order</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
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
                  <Typography sx={{ color: '#888', fontSize: '12px', fontWeight: 700, mb: 1 }}>
                    {orderType === 'limit' ? 'LIMIT PRICE (USD)' : 'MARKET PRICE (ESTIMATED)'}
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={price}
                    disabled={orderType === 'market'}
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

