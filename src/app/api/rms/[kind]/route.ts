import { NextResponse } from 'next/server'

import {
  createRmsMasterData,
  listRmsMasterData,
  type RmsMasterDataKind
} from '@/lib/forge-platform/rms'

const KINDS = new Set<RmsMasterDataKind>([
  'stations', 'shifts', 'apparatus', 'units', 'personnel', 'occupancies', 'preplans', 'rosters'
])

function asKind(value: string): RmsMasterDataKind {
  if (!KINDS.has(value as RmsMasterDataKind)) throw new Error(`Unsupported RMS resource: ${value}`)
  return value as RmsMasterDataKind
}

export async function GET(request: Request, context: { params: Promise<{ kind: string }> }) {
  try {
    const { kind: rawKind } = await context.params
    const kind = asKind(rawKind)
    const url = new URL(request.url)
    const result = await listRmsMasterData(kind, {
      page: Number(url.searchParams.get('page') || '1'),
      pageSize: Number(url.searchParams.get('pageSize') || '100'),
      search: url.searchParams.get('search') || undefined
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load RMS data.' },
      { status: 400 }
    )
  }
}

export async function POST(request: Request, context: { params: Promise<{ kind: string }> }) {
  try {
    const { kind: rawKind } = await context.params
    const kind = asKind(rawKind)
    const payload = await request.json()
    const result = await createRmsMasterData(kind, payload)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 400
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create RMS data.' },
      { status }
    )
  }
}
