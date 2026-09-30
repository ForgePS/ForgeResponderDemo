import 'server-only'

type ForgeApiEnvelope<T> = {
  data: T
  meta?: {
    requestId?: string
    correlationId?: string
    pagination?: { page: number; pageSize: number; total: number }
  }
}

export type ForgePlatformMode = 'demo' | 'connected' | 'auto'

export type ForgePlatformResult<T> = {
  data: T
  source: 'platform' | 'demo'
  etag?: string
  meta?: ForgeApiEnvelope<T>['meta']
}

export class ForgePlatformApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ForgePlatformApiError'
    this.status = status
    this.code = code
  }
}

export function getForgePlatformMode(): ForgePlatformMode {
  const mode = (process.env.FORGE_PLATFORM_MODE || 'demo').trim().toLowerCase()
  if (mode === 'connected' || mode === 'auto') return mode
  return 'demo'
}

export function getForgeTenantId(): string {
  return process.env.FORGE_PLATFORM_TENANT_ID?.trim() || 'forge-demo'
}

function getBaseUrl(): string {
  const url = process.env.FORGE_PLATFORM_API_URL?.trim()
  if (!url) throw new ForgePlatformApiError('FORGE_PLATFORM_API_URL is not configured.', 503, 'API_NOT_CONFIGURED')
  return url.replace(/\/$/, '')
}

function authHeaders(): Record<string, string> {
  const bearer = process.env.FORGE_PLATFORM_BEARER_TOKEN?.trim()
  if (bearer) return { Authorization: `Bearer ${bearer}` }

  const principal = process.env.FORGE_PLATFORM_DEV_PRINCIPAL?.trim()
  if (principal) return { 'x-forge-dev-principal': principal }

  return {}
}

async function parse<T>(response: Response): Promise<ForgePlatformResult<T>> {
  let body: ForgeApiEnvelope<T> | { error?: { message?: string; code?: string } }
  try {
    body = await response.json() as ForgeApiEnvelope<T> | { error?: { message?: string; code?: string } }
  } catch {
    throw new ForgePlatformApiError(`Forge Platform request failed with HTTP ${response.status}.`, response.status)
  }

  if (!response.ok || !('data' in body)) {
    const err = 'error' in body ? body.error : undefined
    throw new ForgePlatformApiError(err?.message || `Forge Platform request failed with HTTP ${response.status}.`, response.status, err?.code)
  }

  return {
    data: body.data,
    source: 'platform',
    etag: response.headers.get('etag') || undefined,
    meta: body.meta
  }
}

export async function forgePlatformGet<T>(
  path: string,
  query?: Record<string, string | number | undefined>
): Promise<ForgePlatformResult<T>> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  const response = await fetch(`${getBaseUrl()}${path}${qs ? `?${qs}` : ''}`, {
    headers: {
      Accept: 'application/json',
      'x-tenant-id': getForgeTenantId(),
      ...authHeaders()
    },
    cache: 'no-store'
  })
  return parse<T>(response)
}

export async function forgePlatformSend<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  payload?: unknown,
  options?: { ifMatch?: string; idempotencyKey?: string }
): Promise<ForgePlatformResult<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-tenant-id': getForgeTenantId(),
    ...authHeaders()
  }
  if (payload !== undefined) headers['Content-Type'] = 'application/json'
  if (options?.ifMatch) headers['If-Match'] = options.ifMatch
  if (options?.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey

  const response = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers,
    body: payload === undefined ? undefined : JSON.stringify(payload),
    cache: 'no-store'
  })
  return parse<T>(response)
}

export function recordVersionToIfMatch(recordVersion: number): string {
  return `W/"${recordVersion}"`
}
