import { NextRequest, NextResponse } from 'next/server'
import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'

export const dynamic = 'force-dynamic'

/**
 * GET /api/trading/assets
 * Returns all available trading assets with optional filtering.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')?.toLowerCase()

    let assets = secondaryTradingAssets.investments

    if (category) {
      assets = assets.filter(asset => asset.category === category)
    }

    if (search) {
      assets = assets.filter(asset =>
        asset.title.toLowerCase().includes(search) ||
        asset.symbol.toLowerCase().includes(search)
      )
    }

    return NextResponse.json({
      assets,
      total: assets.length,
    })
  } catch (error: any) {
    console.error('Error fetching trading assets:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}
