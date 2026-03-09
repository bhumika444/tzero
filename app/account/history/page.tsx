'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Button,
    CircularProgress,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import AccountLayout from '@/components/portfolio/AccountLayout'

interface Transaction {
    id: string
    type?: string
    direction?: 'DEPOSIT' | 'WITHDRAWAL'
    amount: number
    status: string
    created_at: string
    symbol?: string
    quantity?: number
    price?: number
    side?: 'buy' | 'sell'
}

export default function HistoryPage() {
    const theme = useTheme()
    const router = useRouter()
    const { isAuthenticated, loading: authLoading } = useAuth()
    const [history, setHistory] = useState<{ payments: Transaction[], trades: Transaction[] }>({ payments: [], trades: [] })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth')
        }
    }, [isAuthenticated, authLoading, router])

    useEffect(() => {
        if (isAuthenticated) {
            fetchHistory()
        }
    }, [isAuthenticated])

    const fetchHistory = async () => {
        try {
            const response = await fetch('/api/account/history')
            if (response.ok) {
                const data = await response.json()
                setHistory(data)
            }
        } catch (error) {
            console.error('Error fetching history:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (authLoading || loading) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress sx={{ color: theme.palette.primary.main }} />
            </Box>
        )
    }

    const allTransactions = [
        ...history.payments.map(p => ({ ...p, source: 'Banking' })),
        ...history.trades.map(t => ({
            ...t,
            source: 'Marketplace',
            amount: t.quantity! * t.price!,
            direction: t.side === 'buy' ? 'WITHDRAWAL' : 'DEPOSIT', // Simple mapping for unified view
            status: 'COMPLETED'
        }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return (
        <Box sx={{ minHeight: '100vh' }}>
            <Header />
            <Box sx={{ pt: '64px' }}>
                <AccountLayout>
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                            <IconButton onClick={() => router.back()} sx={{ color: '#ffffff' }}>
                                <ArrowBack />
                            </IconButton>
                            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>
                                Transaction History
                            </Typography>
                        </Box>

                        <TableContainer component={Paper} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: '#888888', fontWeight: 600 }}>Type</TableCell>
                                        <TableCell sx={{ color: '#888888', fontWeight: 600 }}>Source</TableCell>
                                        <TableCell sx={{ color: '#888888', fontWeight: 600 }}>Details</TableCell>
                                        <TableCell sx={{ color: '#888888', fontWeight: 600 }}>Amount</TableCell>
                                        <TableCell sx={{ color: '#888888', fontWeight: 600 }}>Date</TableCell>
                                        <TableCell sx={{ color: '#888888', fontWeight: 600 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {allTransactions.map((tx, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell sx={{ color: '#ffffff' }}>
                                                {tx.source === 'Marketplace' ? tx.side?.toUpperCase() : tx.direction}
                                            </TableCell>
                                            <TableCell sx={{ color: '#ffffff' }}>
                                                <Chip
                                                    label={tx.source}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: tx.source === 'Marketplace' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                                                        color: tx.source === 'Marketplace' ? theme.palette.primary.main : '#2196f3',
                                                        fontSize: '10px',
                                                        fontWeight: 700
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: '#ffffff' }}>
                                                {tx.source === 'Marketplace' ? `${tx.quantity} shares of ${tx.symbol}` : (tx.type || 'ACH')}
                                            </TableCell>
                                            <TableCell sx={{
                                                color: tx.direction === 'DEPOSIT' || tx.side === 'sell' ? theme.palette.primary.main : '#ff4d4d',
                                                fontWeight: 700
                                            }}>
                                                {tx.direction === 'DEPOSIT' || tx.side === 'sell' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </TableCell>
                                            <TableCell sx={{ color: '#888888' }}>
                                                {formatDate(tx.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={tx.status}
                                                    size="small"
                                                    sx={{
                                                        fontSize: '11px',
                                                        backgroundColor: tx.status === 'COMPLETED' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                                                        color: tx.status === 'COMPLETED' ? theme.palette.primary.main : '#ffc107'
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {allTransactions.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} sx={{ textAlign: 'center', py: 8, color: '#888888' }}>
                                                No transactions found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </AccountLayout>
            </Box>
        </Box>
    )
}
