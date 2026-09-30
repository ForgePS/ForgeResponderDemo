import 'server-only'

import { randomUUID } from 'node:crypto'

import { readForgeData, writeForgeData } from '@/utils/forgeDataStore'
import {
  ForgePlatformApiError,
  forgePlatformGet,
  forgePlatformSend,
  getForgePlatformMode,
  getForgeTenantId,
  recordVersionToIfMatch,
  type ForgePlatformResult
} from '@/lib/forge-platform/server'

export type RmsMasterDataKind =
  | 'stations'
  | 'shifts'
  | 'apparatus'
  | 'units'
  | 'personnel'
  | 'occupancies'
  | 'preplans'
  | 'rosters'

const demoEntityMap: Record<RmsMasterDataKind, string> = {
  stations: 'stations',
  shifts: 'shifts',
  apparatus: 'apparatus',
  units: 'units',
  personnel: 'personnel',
  occupancies: 'occupancies',
  preplans: 'preplans',
  rosters: 'rosters'
}

function demoRows<T extends Record<string, unknown>>(kind: RmsMasterDataKind): ForgePlatformResult<T[]> {
  const rows = readForgeData<T[]>(demoEntityMap[kind]).filter(row => !row.deletedAt)
  return { data: rows, source: 'demo' }
}

function demoCreate<T extends Record<string, unknown>>(
  kind: RmsMasterDataKind,
  payload: T
): ForgePlatformResult<T & { id: string; recordVersion: number }> {
  const entity = demoEntityMap[kind]
  const rows = readForgeData<Array<Record<string, unknown>>>(entity)
  const now = new Date().toISOString()
  const row = {
    id: randomUUID(),
    ...payload,
    recordVersion: 1,
    createdAt: now,
    updatedAt: now
  }
  writeForgeData(entity, [...rows, row])
  return { data: row as T & { id: string; recordVersion: number }, source: 'demo' }
}

function demoUpdate<T extends Record<string, unknown>>(
  kind: RmsMasterDataKind,
  id: string,
  payload: Partial<T>,
  expectedVersion?: number
): ForgePlatformResult<T & { id: string; recordVersion: number }> {
  const entity = demoEntityMap[kind]
  const rows = readForgeData<Array<Record<string, unknown>>>(entity)
  const index = rows.findIndex(row => row.id === id && !row.deletedAt)
  if (index < 0) throw new ForgePlatformApiError(`${kind} record not found.`, 404, 'NOT_FOUND')

  const current = rows[index]
  const currentVersion = Number(current.recordVersion || 1)
  if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
    throw new ForgePlatformApiError('Resource was modified elsewhere.', 412, 'PRECONDITION_FAILED')
  }

  const updated = {
    ...current,
    ...payload,
    id,
    recordVersion: currentVersion + 1,
    updatedAt: new Date().toISOString()
  }
  rows[index] = updated
  writeForgeData(entity, rows)
  return { data: updated as T & { id: string; recordVersion: number }, source: 'demo' }
}

function demoDelete(
  kind: RmsMasterDataKind,
  id: string,
  expectedVersion?: number
): ForgePlatformResult<Record<string, unknown>> {
  const entity = demoEntityMap[kind]
  const rows = readForgeData<Array<Record<string, unknown>>>(entity)
  const index = rows.findIndex(row => row.id === id && !row.deletedAt)
  if (index < 0) throw new ForgePlatformApiError(`${kind} record not found.`, 404, 'NOT_FOUND')

  const current = rows[index]
  const currentVersion = Number(current.recordVersion || 1)
  if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
    throw new ForgePlatformApiError('Resource was modified elsewhere.', 412, 'PRECONDITION_FAILED')
  }

  const updated = {
    ...current,
    recordVersion: currentVersion + 1,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  rows[index] = updated
  writeForgeData(entity, rows)
  return { data: updated, source: 'demo' }
}

function rmsPath(kind: RmsMasterDataKind, id?: string): string {
  const base = `/api/v1/tenants/${getForgeTenantId()}/rms/${kind}`
  return id ? `${base}/${id}` : base
}

export async function listRmsMasterData<T extends Record<string, unknown>>(
  kind: RmsMasterDataKind,
  options?: { page?: number; pageSize?: number; search?: string }
): Promise<ForgePlatformResult<T[]>> {
  const mode = getForgePlatformMode()
  if (mode === 'demo') return demoRows<T>(kind)

  try {
    return await forgePlatformGet<T[]>(rmsPath(kind), {
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? 100,
      search: options?.search
    })
  } catch (error) {
    if (mode === 'auto' && error instanceof ForgePlatformApiError) return demoRows<T>(kind)
    throw error
  }
}


export async function getRmsMasterData<T extends Record<string, unknown>>(
  kind: RmsMasterDataKind,
  id: string
): Promise<ForgePlatformResult<T>> {
  const mode = getForgePlatformMode()
  if (mode === 'demo') {
    const row = demoRows<T>(kind).data.find(item => item.id === id)
    if (!row) throw new ForgePlatformApiError(`${kind} record not found.`, 404, 'NOT_FOUND')
    return { data: row, source: 'demo' }
  }

  try {
    return await forgePlatformGet<T>(rmsPath(kind, id))
  } catch (error) {
    if (mode === 'auto' && error instanceof ForgePlatformApiError) {
      const row = demoRows<T>(kind).data.find(item => item.id === id)
      if (!row) throw error
      return { data: row, source: 'demo' }
    }
    throw error
  }
}

export async function createRmsMasterData<T extends Record<string, unknown>>(
  kind: RmsMasterDataKind,
  payload: T
): Promise<ForgePlatformResult<T & { id: string; recordVersion: number }>> {
  const mode = getForgePlatformMode()
  if (mode === 'demo') return demoCreate(kind, payload)

  try {
    return await forgePlatformSend<T & { id: string; recordVersion: number }>(
      rmsPath(kind),
      'POST',
      payload,
      { idempotencyKey: `responder-demo-${kind}-${randomUUID()}` }
    )
  } catch (error) {
    if (mode === 'auto' && error instanceof ForgePlatformApiError) return demoCreate(kind, payload)
    throw error
  }
}

export async function updateRmsMasterData<T extends Record<string, unknown>>(
  kind: RmsMasterDataKind,
  id: string,
  payload: Partial<T>,
  recordVersion: number
): Promise<ForgePlatformResult<T & { id: string; recordVersion: number }>> {
  const mode = getForgePlatformMode()
  if (mode === 'demo') return demoUpdate(kind, id, payload, recordVersion)

  try {
    return await forgePlatformSend<T & { id: string; recordVersion: number }>(
      rmsPath(kind, id),
      'PATCH',
      payload,
      { ifMatch: recordVersionToIfMatch(recordVersion) }
    )
  } catch (error) {
    if (mode === 'auto' && error instanceof ForgePlatformApiError) {
      return demoUpdate(kind, id, payload, recordVersion)
    }
    throw error
  }
}

export async function deleteRmsMasterData(
  kind: RmsMasterDataKind,
  id: string,
  recordVersion: number
): Promise<ForgePlatformResult<Record<string, unknown>>> {
  const mode = getForgePlatformMode()
  if (mode === 'demo') return demoDelete(kind, id, recordVersion)

  try {
    return await forgePlatformSend<Record<string, unknown>>(
      rmsPath(kind, id),
      'DELETE',
      undefined,
      { ifMatch: recordVersionToIfMatch(recordVersion) }
    )
  } catch (error) {
    if (mode === 'auto' && error instanceof ForgePlatformApiError) {
      return demoDelete(kind, id, recordVersion)
    }
    throw error
  }
}
