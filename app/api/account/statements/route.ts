import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthUserId(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Dummy statements for now
        const statements = [
            { id: 'stm_1', title: 'February 2026 Account Statement', date: 'Mar 1, 2026', type: 'Statement' },
            { id: 'stm_2', title: 'January 2026 Account Statement', date: 'Feb 1, 2026', type: 'Statement' },
            { id: 'stm_3', title: '2025 Annual Tax Document', date: 'Jan 15, 2026', type: 'Tax' },
        ]

        return NextResponse.json({
            statements
        })
    } catch (error: any) {
        console.error('Error fetching statements:', error)
        return NextResponse.json({ error: error?.message || 'Failed to fetch statements' }, { status: 500 })
    }
}
