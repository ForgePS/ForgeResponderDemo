import 'server-only'

import { loadForgeSeed } from '@/utils/forgeSeed'
import {
  ForgePlatformApiError,
  forgePlatformGet,
  getForgePlatformMode,
  getForgeTenantId,
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

const demoSeedMap: Partial<Record<RmsMasterDataKind, string>> = {
  apparatus: 'apparatus',
  personnel: 'personnel',
  occupancies: 'occupancies',
  preplans: 'preplans'
}

function demoRows<T>(kind: RmsMasterDataKind): ForgePlatformResult<T[]> {
  const seed = demoSeedMap[kind]
  if (!seed) return { data: [], source: 'demo' }
  return { data: loadForgeSeed<T[]>(seed), source: 'demo' }
}

export async function listRmsMasterData<T extends Record<string, unknown>>(
  kind: RmsMasterDataKind,
  options?: { page?: number; pageSize?: number; search?: string }
): Promise<ForgePlatformResult<T[]>> {
  const mode = getForgePlatformMode()
  if (mode === 'demo') return demoRows<T>(kind)

  try {
    return await forgePlatformGet<T[]>(
      `/api/v1/tenants/${getForgeTenantId()}/rms/${kind}`,
      {
        page: options?.page ?? 1,
        pageSize: options?.pageSize ?? 100,
        search: options?.search
      }
    )
  } catch (error) {
    if (mode === 'auto' && error instanceof ForgePlatformApiError) return demoRows<T>(kind)
    throw error
  }
}
