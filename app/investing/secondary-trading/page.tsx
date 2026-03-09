'use client'

/**
 * SECONDARY MARKETPLACE - Asset Listing Page
 *
 * Build this page to display available trading assets with filtering and search.
 * Navigate to /investing/secondary-trading/[id] on asset click.
 *
 * Data: GET /api/trading/assets → { assets: [...], total: 5 }
 * Or: import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'
 * Utils: import { formatCurrency, slugify } from '@/lib/investmentUtils'
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  alpha,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '@/contexts/AuthContext'
import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'
import { formatCurrency, getSecondaryTradingSymbol, getSeededColor } from '@/lib/investmentUtils'

type Asset = {
  id: string
  title: string
  category: string
  basePrice: number
  previousValue: number
  currentValue: number
  performancePercent: number
  isPositive: boolean
  volume: string
  companyDescription: string
  symbol?: string
}

export default function SecondaryTradingPage() {
  const router = useRouter()
  const theme = useTheme()
  const { user, isAuthenticated } = useAuth()
  const allAssets = secondaryTradingAssets.investments as Asset[]

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = useMemo(() => {
    const cats = allAssets.map(a => a.category)
    return Array.from(new Set(cats))
  }, [allAssets])

  const filteredAssets = useMemo(() => {
    return allAssets.filter(asset => {
      const matchesSearch = asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.symbol && asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())) ||
        getSecondaryTradingSymbol(asset.title, asset.symbol).toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory ? asset.category === selectedCategory : true
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory, allAssets])

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#000000' }}>
      <Header />

      <Container maxWidth="lg" sx={{ pt: { xs: '100px', sm: '120px' }, pb: 8 }}>
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, color: '#ffffff', mb: 1.5, letterSpacing: '-0.02em' }}>
            Secondary Marketplace
          </Typography>
          <Typography variant="h6" sx={{ color: '#888888', fontWeight: 400, maxWidth: '600px' }}>
            The next generation of digital security trading. Browse, analyze, and trade premium assets in a secure ecosystem.
          </Typography>
        </Box>

        {/* Search & Filters */}
        <Box sx={{ mb: 6 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search assets by name or symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#555' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                <Chip
                  label="All Assets"
                  onClick={() => setSelectedCategory(null)}
                  sx={{
                    borderRadius: '8px',
                    fontWeight: 600,
                    backgroundColor: selectedCategory === null ? theme.palette.primary.main : 'rgba(255,255,255,0.05)',
                    color: selectedCategory === null ? '#000000' : '#888888',
                    '&:hover': {
                      backgroundColor: selectedCategory === null ? theme.palette.primary.main : 'rgba(255,255,255,0.1)',
                    }
                  }}
                />
                {categories.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                    onClick={() => setSelectedCategory(cat)}
                    sx={{
                      borderRadius: '8px',
                      fontWeight: 600,
                      backgroundColor: selectedCategory === cat ? theme.palette.primary.main : 'rgba(255,255,255,0.05)',
                      color: selectedCategory === cat ? '#000000' : '#888888',
                      '&:hover': {
                        backgroundColor: selectedCategory === cat ? theme.palette.primary.main : 'rgba(255,255,255,0.1)',
                      }
                    }}
                  />
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Asset Cards */}
        {filteredAssets.length > 0 ? (
          <Grid container spacing={3}>
            {filteredAssets.map((asset) => {
              const symbol = getSecondaryTradingSymbol(asset.title, asset.symbol)
              return (
                <Grid item xs={12} sm={6} md={4} key={asset.id}>
                  <Paper
                    onClick={() => router.push(`/investing/secondary-trading/${asset.id}`)}
                    elevation={0}
                    sx={{
                      p: 3,
                      height: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        transform: 'translateY(-4px)',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        boxShadow: `0 12px 24px -10px ${alpha(theme.palette.primary.main, 0.15)}`,
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '4px',
                        backgroundColor: getSeededColor(symbol),
                        opacity: 0.6,
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                          width: 48, height: 48, borderRadius: '14px',
                          backgroundColor: alpha(getSeededColor(symbol), 0.15),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1px solid ${alpha(getSeededColor(symbol), 0.2)}`,
                        }}>
                          <Typography sx={{ color: getSeededColor(symbol), fontWeight: 800, fontSize: '16px' }}>
                            {symbol.slice(0, 2)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '18px', mb: 0.2 }}>
                            {asset.title}
                          </Typography>
                          <Typography sx={{ color: '#666666', fontWeight: 600, fontSize: '13px', letterSpacing: '0.05em' }}>
                            {symbol}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={asset.category}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: '#888',
                          fontWeight: 700,
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          borderRadius: '6px'
                        }}
                      />
                    </Box>

                    <Box sx={{ mt: 'auto' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <Box>
                          <Typography sx={{ color: '#888888', fontSize: '12px', fontWeight: 500, mb: 0.5 }}>
                            CURRENT VALUE
                          </Typography>
                          <Typography sx={{ color: '#ffffff', fontWeight: 800, fontSize: '24px', lineHeight: 1 }}>
                            {formatCurrency(asset.currentValue)}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography sx={{
                            color: asset.isPositive ? theme.palette.primary.main : '#ff4d4d',
                            fontWeight: 700,
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            backgroundColor: alpha(asset.isPositive ? theme.palette.primary.main : '#ff4d4d', 0.1),
                            px: 1, py: 0.5, borderRadius: '8px'
                          }}>
                            {asset.isPositive ? '+' : ''}{asset.performancePercent.toFixed(2)}%
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              )
            })}
          </Grid>
        ) : (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <Typography sx={{ color: '#444', fontSize: '18px' }}>
              No assets found matching your search criteria.
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  )
}

