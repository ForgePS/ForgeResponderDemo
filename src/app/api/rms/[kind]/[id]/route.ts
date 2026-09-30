import { NextResponse } from 'next/server'

import {
  deleteRmsMasterData,
  updateRmsMasterData,
  type RmsMasterDataKind
} from '@/lib/forge-platform/rms'

const KINDS = new Set<RmsMasterDataKind>([
  'stations', 'shifts', 'apparatus', 'units', 'personnel', 'occupancies', 'preplans', 'rosters'
])

function asKind(value: string): RmsMasterDataKind {
  if (!KINDS.has(value as RmsMasterDataKind)) throw new Error(`Unsupported RMS resource: ${value}`)
  return value as RmsMasterDataKind
}

function readVersion(request: Request): number {
  const raw = request.headers.get('if-match') || request.headers.get('x-record-version')
  if (!raw) throw new Error('Record version is required.')
  const match = raw.match(/(\d+)/)
  if (!match) throw new Error('Invalid record version.')
  return Number(match[1])
}

export async function PATCH(request: Request, context: { params: Promise<{ kind: string; id: string }> }) {
  try {
    const { kind: rawKind, id } = await context.params
    const kind = asKind(rawKind)
    const recordVersion = readVersion(request)
    const payload = await request.json()
    const result = await updateRmsMasterData(kind, id, payload, recordVersion)
    return NextResponse.json(result)
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 400
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update RMS data.' },
      { status }
    )
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ kind: string; id: string }> }) {
  try {
    const { kind: rawKind, id } = await context.params
    const kind = asKind(rawKind)
    const recordVersion = readVersion(request)
    const result = await deleteRmsMasterData(kind, id, recordVersion)
    return NextResponse.json(result)
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 400
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete RMS data.' },
      { status }
    )
  }
}
