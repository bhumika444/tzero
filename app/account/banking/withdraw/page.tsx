'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    MenuItem,
    CircularProgress,
    IconButton,
    InputAdornment,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import AccountLayout from '@/components/portfolio/AccountLayout'

export default function WithdrawPage() {
    const theme = useTheme()
    const router = useRouter()
    const { isAuthenticated, loading: authLoading } = useAuth()
    const [amount, setAmount] = useState('')
    const [balance, setBalance] = useState(0)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [paymentMethods, setPaymentMethods] = useState<any[]>([])
    const [selectedMethod, setSelectedMethod] = useState('')

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth')
        }
    }, [isAuthenticated, authLoading, router])

    useEffect(() => {
        if (isAuthenticated) {
            fetchData()
        }
    }, [isAuthenticated])

    const fetchData = async () => {
        try {
            const [balRes, pmRes] = await Promise.all([
                fetch('/api/banking/balance'),
                fetch('/api/banking/payment-methods')
            ])

            if (balRes.ok) {
                const data = await balRes.json()
                setBalance(data.balance)
            }

            if (pmRes.ok) {
                const data = await pmRes.json()
                setPaymentMethods(data.paymentMethods || [])
                if (data.paymentMethods?.length > 0) {
                    setSelectedMethod(data.paymentMethods[0].id)
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || Number(amount) <= 0 || Number(amount) > balance) return

        setProcessing(true)
        try {
            const response = await fetch('/api/banking/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: Number(amount), paymentMethodId: selectedMethod }),
            })

            if (response.ok) {
                alert('Withdrawal request submitted successfully!')
                router.push('/account/banking')
            } else {
                const data = await response.json()
                alert(data.error || 'Withdrawal failed')
            }
        } catch (error) {
            console.error('Withdrawal error:', error)
            alert('An unexpected error occurred')
        } finally {
            setProcessing(false)
        }
    }

    if (authLoading || loading) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress sx={{ color: theme.palette.primary.main }} />
            </Box>
        )
    }

    return (
        <Box sx={{ minHeight: '100vh' }}>
            <Header />
            <Box sx={{ pt: '64px' }}>
                <AccountLayout>
                    <Box sx={{ p: 3, maxWidth: '600px', mx: 'auto' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                            <IconButton onClick={() => router.back()} sx={{ color: '#ffffff' }}>
                                <ArrowBack />
                            </IconButton>
                            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>
                                Withdraw Funds
                            </Typography>
                        </Box>

                        <Paper sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <Typography sx={{ color: '#888888', mb: 1, fontSize: '14px' }}>AVAILABLE BALANCE</Typography>
                            <Typography sx={{ color: '#ffffff', fontSize: '32px', fontWeight: 800, mb: 4 }}>
                                ${balance.toFixed(2)}
                            </Typography>

                            <form onSubmit={handleWithdraw}>
                                <TextField
                                    fullWidth
                                    label="Amount to Withdraw"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    sx={{
                                        mb: 3,
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                            color: '#ffffff',
                                            borderRadius: '12px',
                                        },
                                        '& .MuiInputLabel-root': { color: '#888888' },
                                    }}
                                />

                                <TextField
                                    select
                                    fullWidth
                                    label="Withdraw to"
                                    value={selectedMethod}
                                    onChange={(e) => setSelectedMethod(e.target.value)}
                                    sx={{
                                        mb: 4,
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                            color: '#ffffff',
                                            borderRadius: '12px',
                                        },
                                        '& .MuiInputLabel-root': { color: '#888888' },
                                    }}
                                >
                                    {paymentMethods.map((method) => (
                                        <MenuItem key={method.id} value={method.id}>
                                            {method.bank_name || method.card_brand} (****{method.account_number_masked || method.card_last_four})
                                        </MenuItem>
                                    ))}
                                    {paymentMethods.length === 0 && (
                                        <MenuItem disabled>No payment methods found</MenuItem>
                                    )}
                                </TextField>

                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    type="submit"
                                    disabled={processing || !amount || Number(amount) <= 0 || Number(amount) > balance || !selectedMethod}
                                    sx={{
                                        py: 2,
                                        borderRadius: '12px',
                                        fontWeight: 800,
                                        fontSize: '16px',
                                        backgroundColor: theme.palette.primary.main,
                                        '&:hover': { backgroundColor: '#00E677' },
                                    }}
                                >
                                    {processing ? <CircularProgress size={24} color="inherit" /> : 'Confirm Withdrawal'}
                                </Button>
                            </form>
                        </Paper>
                    </Box>
                </AccountLayout>
            </Box>
        </Box>
    )
}
