import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { readForgeData, writeForgeData } from '@/utils/forgeDataStore'

export async function GET() {
  return NextResponse.json({ data: readForgeData<Record<string, unknown>[]>('hydrants'), source: 'demo' })
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>
    const rows = readForgeData<Record<string, unknown>[]>('hydrants')
    const now = new Date().toISOString()
    const row = { id: randomUUID(), ...payload, recordVersion: 1, createdAt: now, updatedAt: now }
    writeForgeData('hydrants', [row, ...rows])
    return NextResponse.json({ data: row, source: 'demo' }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create hydrant.' }, { status: 400 })
  }
}
