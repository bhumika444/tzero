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
import { ArrowBack, Download } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import AccountLayout from '@/components/portfolio/AccountLayout'

interface Statement {
    id: string
    title: string
    date: string
    type: string
}

export default function StatementsPage() {
    const theme = useTheme()
    const router = useRouter()
    const { isAuthenticated, loading: authLoading } = useAuth()
    const [statements, setStatements] = useState<Statement[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth')
        }
    }, [isAuthenticated, authLoading, router])

    useEffect(() => {
        if (isAuthenticated) {
            fetchStatements()
        }
    }, [isAuthenticated])

    const fetchStatements = async () => {
        try {
            const response = await fetch('/api/account/statements')
            if (response.ok) {
                const data = await response.json()
                setStatements(data.statements)
            }
        } catch (error) {
            console.error('Error fetching statements:', error)
        } finally {
            setLoading(false)
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
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                            <IconButton onClick={() => router.back()} sx={{ color: '#ffffff' }}>
                                <ArrowBack />
                            </IconButton>
                            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>
                                Account Documents
                            </Typography>
                        </Box>

                        <Typography variant="body1" sx={{ color: '#888888', mb: 4 }}>
                            Your account statements and tax documents are available for download in PDF format.
                        </Typography>

                        <TableContainer component={Paper} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: '#888888', fontWeight: 600 }}>Document Name</TableCell>
                                        <TableCell sx={{ color: '#888888', fontWeight: 600 }}>Date Issued</TableCell>
                                        <TableCell sx={{ color: '#888888', fontWeight: 600 }}>Type</TableCell>
                                        <TableCell sx={{ color: '#888888', fontWeight: 600, textAlign: 'right' }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {statements.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{doc.title}</TableCell>
                                            <TableCell sx={{ color: '#888888' }}>{doc.date}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={doc.type}
                                                    size="small"
                                                    sx={{
                                                        fontSize: '11px',
                                                        backgroundColor: doc.type === 'Tax' ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                        color: doc.type === 'Tax' ? '#ffc107' : '#ffffff'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'right' }}>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<Download />}
                                                    size="small"
                                                    sx={{
                                                        color: theme.palette.primary.main,
                                                        borderColor: theme.palette.primary.main,
                                                        '&:hover': {
                                                            borderColor: '#ffffff',
                                                            color: '#ffffff'
                                                        }
                                                    }}
                                                >
                                                    Download
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {statements.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} sx={{ textAlign: 'center', py: 8, color: '#888888' }}>
                                                No documents available yet
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
