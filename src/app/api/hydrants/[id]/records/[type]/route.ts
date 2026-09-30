import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'

import { readForgeData, writeForgeData } from '@/utils/forgeDataStore'

type Hydrant = Record<string, unknown> & { id: string }
type RecordType = 'flow-tests' | 'inspections' | 'damage'

const entityByType: Record<RecordType, string> = {
  'flow-tests': 'hydrant-flow-tests',
  inspections: 'hydrant-inspections',
  damage: 'hydrant-damage-reports'
}

function asType(value: string): RecordType {
  if (value === 'flow-tests' || value === 'inspections' || value === 'damage') return value
  throw new Error(`Unsupported hydrant record type: ${value}`)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; type: string }> }
) {
  try {
    const { id, type: rawType } = await context.params
    const type = asType(rawType)
    const payload = await request.json() as Record<string, unknown>

    const hydrants = readForgeData<Hydrant[]>('hydrants')
    const index = hydrants.findIndex(row => row.id === id)
    if (index < 0) {
      return NextResponse.json({ error: 'Hydrant not found.' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const entity = entityByType[type]
    const records = readForgeData<Array<Record<string, unknown>>>(entity)
    const record = {
      id: randomUUID(),
      hydrantId: id,
      ...payload,
      createdAt: now,
      updatedAt: now
    }

    writeForgeData(entity, [record, ...records])

    const current = hydrants[index]
    const updated: Hydrant = { ...current, updatedAt: now }

    if (type === 'flow-tests') {
      updated.staticPsi = payload.staticPsi
      updated.residualPsi = payload.residualPsi
      updated.pitotPsi = payload.pitotPsi
      updated.flowGpm = payload.flowGpm
      updated.nfpaClass = payload.nfpaClass
      updated.nfpaColor = payload.nfpaColor
      updated.lastFlowTestAt = now
    }

    if (type === 'inspections') {
      if (payload.operationalStatus) updated.status = payload.operationalStatus
      updated.lastInspectionAt = now
    }

    if (type === 'damage') {
      if (payload.operationalStatus) updated.status = payload.operationalStatus
      updated.lastDamageReportAt = now
    }

    hydrants[index] = updated
    writeForgeData('hydrants', hydrants)

    const events = readForgeData<Array<Record<string, unknown>>>('activity-events')
    const title =
      type === 'flow-tests' ? 'Hydrant flow test completed'
      : type === 'inspections' ? 'Hydrant inspection completed'
      : 'Hydrant damage report submitted'
    writeForgeData('activity-events', [
      {
        id: randomUUID(),
        type: `hydrant-${type}`,
        title,
        resourceType: 'hydrant',
        resourceId: id,
        occurredAt: now,
        detail: payload
      },
      ...events
    ].slice(0, 500))

    return NextResponse.json({ data: record, hydrant: updated, source: 'demo' }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save hydrant record.' },
      { status: 400 }
    )
  }
}
