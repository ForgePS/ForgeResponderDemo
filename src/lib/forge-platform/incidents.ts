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

export type IncidentStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'READY_FOR_REVIEW'
  | 'SUBMITTED_FOR_REVIEW'
  | 'RETURNED_FOR_CORRECTION'
  | 'APPROVED'
  | 'FINALIZED'
  | 'VOIDED'
  | 'ARCHIVED'

export type IncidentRecord = {
  id: string
  incidentNumber: string
  status: IncidentStatus
  incidentDate?: string | null
  alarmAt?: string | null
  stationId?: string | null
  shiftId?: string | null
  responseDistrict?: string | null
  incidentSource?: string | null
  dispatchDescription?: string | null
  mutualAidStatus?: string | null
  aidDirection?: string | null
  incidentCommanderPersonnelId?: string | null
  reportOwnerUserId?: string | null
  primaryIncidentTypeCode?: string | null
  recordVersion: number
  createdAt: string
  updatedAt: string
}

export type NarrativeRecord = {
  id: string
  incidentId: string
  body: string
  versionNote?: string | null
  recordVersion: number
  updatedAt: string
}

export type ValidationFinding = {
  severity: 'GUIDANCE' | 'WARNING' | 'BLOCKING_ERROR'
  code: string
  message: string
  sectionKey?: string | null
}

function base(id?: string): string {
  const root = `/api/v1/tenants/${getForgeTenantId()}/neris/incidents`
  return id ? `${root}/${id}` : root
}

function rows(): IncidentRecord[] {
  return readForgeData<IncidentRecord[]>('incidents')
}

function writeRows(next: IncidentRecord[]) {
  writeForgeData('incidents', next)
}

function demoList(): ForgePlatformResult<IncidentRecord[]> {
  return { data: rows().filter(x => x.status !== 'ARCHIVED'), source: 'demo' }
}

function nextIncidentNumber(existing: IncidentRecord[]): string {
  const year = new Date().getFullYear()
  const nums = existing
    .filter(x => x.incidentNumber?.startsWith(`${year}-`))
    .map(x => Number(x.incidentNumber.split('-')[1]))
    .filter(Number.isFinite)
  return `${year}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(6,'0')}`
}

function statusHistory(incidentId: string, fromStatus: IncidentStatus | null, toStatus: IncidentStatus) {
  const history = readForgeData<Record<string, unknown>[]>('incident-status-history')
  writeForgeData('incident-status-history', [
    { id: randomUUID(), incidentId, fromStatus, toStatus, createdAt: new Date().toISOString() },
    ...history
  ])
}

function activity(title: string, incidentId: string, detail?: unknown) {
  const events = readForgeData<Record<string, unknown>[]>('activity-events')
  writeForgeData('activity-events', [
    { id: randomUUID(), type: 'incident', title, resourceType: 'incident', resourceId: incidentId, occurredAt: new Date().toISOString(), detail },
    ...events
  ].slice(0, 500))
}

export async function listIncidents(): Promise<ForgePlatformResult<IncidentRecord[]>> {
  const mode = getForgePlatformMode()
  if (mode === 'demo') return demoList()
  try {
    return await forgePlatformGet<IncidentRecord[]>(base(), { page: 1, pageSize: 100 })
  } catch (error) {
    if (mode === 'auto' && error instanceof ForgePlatformApiError) return demoList()
    throw error
  }
}

export async function getIncident(id: string): Promise<ForgePlatformResult<IncidentRecord>> {
  const mode = getForgePlatformMode()
  if (mode === 'demo') {
    const row = rows().find(x => x.id === id)
    if (!row) throw new ForgePlatformApiError('Incident not found.', 404, 'NOT_FOUND')
    return { data: row, source: 'demo' }
  }
  try {
    return await forgePlatformGet<IncidentRecord>(base(id))
  } catch (error) {
    if (mode === 'auto' && error instanceof ForgePlatformApiError) {
      const row = rows().find(x => x.id === id)
      if (!row) throw error
      return { data: row, source: 'demo' }
    }
    throw error
  }
}

export async function createIncident(payload: Record<string, unknown>): Promise<ForgePlatformResult<IncidentRecord>> {
  const mode = getForgePlatformMode()
  if (mode === 'demo') {
    const current = rows()
    const now = new Date().toISOString()
    const row: IncidentRecord = {
      id: randomUUID(),
      incidentNumber: String(payload.incidentNumber || nextIncidentNumber(current)),
      status: 'DRAFT',
      incidentDate: payload.incidentDate ? String(payload.incidentDate) : now.slice(0,10),
      alarmAt: payload.alarmAt ? String(payload.alarmAt) : null,
      stationId: payload.stationId ? String(payload.stationId) : null,
      shiftId: payload.shiftId ? String(payload.shiftId) : null,
      responseDistrict: payload.responseDistrict ? String(payload.responseDistrict) : null,
      incidentSource: payload.incidentSource ? String(payload.incidentSource) : 'MANUAL',
      dispatchDescription: payload.dispatchDescription ? String(payload.dispatchDescription) : null,
      mutualAidStatus: payload.mutualAidStatus ? String(payload.mutualAidStatus) : null,
      aidDirection: payload.aidDirection ? String(payload.aidDirection) : null,
      incidentCommanderPersonnelId: payload.incidentCommanderPersonnelId ? String(payload.incidentCommanderPersonnelId) : null,
      reportOwnerUserId: payload.reportOwnerUserId ? String(payload.reportOwnerUserId) : null,
      primaryIncidentTypeCode: payload.primaryIncidentTypeCode ? String(payload.primaryIncidentTypeCode) : null,
      recordVersion: 1,
      createdAt: now,
      updatedAt: now
    }
    writeRows([row, ...current])
    statusHistory(row.id, null, 'DRAFT')
    activity(`Incident ${row.incidentNumber} created`, row.id)
    return { data: row, source: 'demo' }
  }
  try {
    return await forgePlatformSend<IncidentRecord>(base(), 'POST', payload, {
      idempotencyKey: `responder-demo-incident-${randomUUID()}`
    })
  } catch (error) {
    if (mode === 'auto' && error instanceof ForgePlatformApiError) return createIncidentDemo(payload)
    throw error
  }
}

function createIncidentDemo(payload: Record<string, unknown>): ForgePlatformResult<IncidentRecord> {
  const current = rows()
  const now = new Date().toISOString()
  const row: IncidentRecord = {
    id: randomUUID(),
    incidentNumber: String(payload.incidentNumber || nextIncidentNumber(current)),
    status: 'DRAFT',
    incidentDate: payload.incidentDate ? String(payload.incidentDate) : now.slice(0,10),
    alarmAt: payload.alarmAt ? String(payload.alarmAt) : null,
    stationId: payload.stationId ? String(payload.stationId) : null,
    shiftId: payload.shiftId ? String(payload.shiftId) : null,
    responseDistrict: payload.responseDistrict ? String(payload.responseDistrict) : null,
    incidentSource: payload.incidentSource ? String(payload.incidentSource) : 'MANUAL',
    dispatchDescription: payload.dispatchDescription ? String(payload.dispatchDescription) : null,
    mutualAidStatus: payload.mutualAidStatus ? String(payload.mutualAidStatus) : null,
    aidDirection: payload.aidDirection ? String(payload.aidDirection) : null,
    incidentCommanderPersonnelId: payload.incidentCommanderPersonnelId ? String(payload.incidentCommanderPersonnelId) : null,
    reportOwnerUserId: payload.reportOwnerUserId ? String(payload.reportOwnerUserId) : null,
    primaryIncidentTypeCode: payload.primaryIncidentTypeCode ? String(payload.primaryIncidentTypeCode) : null,
    recordVersion: 1,
    createdAt: now,
    updatedAt: now
  }
  writeRows([row, ...current])
  statusHistory(row.id, null, 'DRAFT')
  activity(`Incident ${row.incidentNumber} created`, row.id)
  return { data: row, source: 'demo' }
}

export async function patchIncident(id: string, payload: Record<string, unknown>, recordVersion: number): Promise<ForgePlatformResult<IncidentRecord>> {
  const mode = getForgePlatformMode()
  if (mode === 'demo') return patchIncidentDemo(id,payload,recordVersion)
  try {
    return await forgePlatformSend<IncidentRecord>(base(id), 'PATCH', payload, { ifMatch: recordVersionToIfMatch(recordVersion) })
  } catch (error) {
    if (mode === 'auto' && error instanceof ForgePlatformApiError) return patchIncidentDemo(id,payload,recordVersion)
    throw error
  }
}

function patchIncidentDemo(id: string, payload: Record<string, unknown>, recordVersion: number): ForgePlatformResult<IncidentRecord> {
  const current = rows()
  const index = current.findIndex(x => x.id === id)
  if (index < 0) throw new ForgePlatformApiError('Incident not found.',404,'NOT_FOUND')
  if (current[index].recordVersion !== recordVersion) throw new ForgePlatformApiError('Incident was modified elsewhere.',412,'PRECONDITION_FAILED')
  const updated = { ...current[index], ...payload, id, recordVersion: recordVersion + 1, updatedAt: new Date().toISOString() } as IncidentRecord
  current[index] = updated
  writeRows(current)
  activity(`Incident ${updated.incidentNumber} updated`, id)
  return { data: updated, source: 'demo' }
}

export async function getNarrative(id: string): Promise<ForgePlatformResult<NarrativeRecord | null>> {
  const mode = getForgePlatformMode()
  if (mode === 'demo') {
    const row = readForgeData<NarrativeRecord[]>('incident-narratives').find(x => x.incidentId === id) || null
    return { data: row, source: 'demo' }
  }
  try {
    return await forgePlatformGet<NarrativeRecord | null>(`${base(id)}/narrative`)
  } catch (error) {
    if (mode === 'auto' && error instanceof ForgePlatformApiError) {
      const row = readForgeData<NarrativeRecord[]>('incident-narratives').find(x => x.incidentId === id) || null
      return { data: row, source: 'demo' }
    }
    throw error
  }
}

export async function saveNarrative(id: string, body: string, recordVersion: number, versionNote?: string): Promise<ForgePlatformResult<NarrativeRecord>> {
  const mode = getForgePlatformMode()
  if (mode === 'demo') return saveNarrativeDemo(id,body,recordVersion,versionNote)
  try {
    return await forgePlatformSend<NarrativeRecord>(`${base(id)}/narrative`, 'PATCH', { body, versionNote: versionNote || null }, { ifMatch: recordVersionToIfMatch(recordVersion) })
  } catch (error) {
    if (mode === 'auto' && error instanceof ForgePlatformApiError) return saveNarrativeDemo(id,body,recordVersion,versionNote)
    throw error
  }
}

function saveNarrativeDemo(id: string, body: string, recordVersion: number, versionNote?: string): ForgePlatformResult<NarrativeRecord> {
  const incidentResult = patchIncidentDemo(id, {}, recordVersion)
  const current = readForgeData<NarrativeRecord[]>('incident-narratives')
  const now = new Date().toISOString()
  const existingIndex = current.findIndex(x => x.incidentId === id)
  const row: NarrativeRecord = {
    id: existingIndex >= 0 ? current[existingIndex].id : randomUUID(),
    incidentId: id,
    body,
    versionNote: versionNote || null,
    recordVersion: incidentResult.data.recordVersion,
    updatedAt: now
  }
  if (existingIndex >= 0) current[existingIndex] = row
  else current.unshift(row)
  writeForgeData('incident-narratives', current)
  activity(`Narrative updated for incident ${incidentResult.data.incidentNumber}`, id)
  return { data: row, source: 'demo' }
}

export async function validateIncident(id: string): Promise<ForgePlatformResult<{ok:boolean;findings:ValidationFinding[];blockingErrorCount:number;warningCount:number;guidanceCount:number}>> {
  const mode = getForgePlatformMode()
  if (mode !== 'demo') {
    try {
      return await forgePlatformSend(`${base(id)}/validate`, 'POST')
    } catch (error) {
      if (!(mode === 'auto' && error instanceof ForgePlatformApiError)) throw error
    }
  }
  const incident = (await getIncident(id)).data
  const narrative = (await getNarrative(id)).data
  const findings: ValidationFinding[] = []
  if (!incident.incidentDate) findings.push({severity:'BLOCKING_ERROR',code:'INCIDENT_DATE_REQUIRED',message:'Incident date is required.',sectionKey:'OVERVIEW'})
  if (!incident.primaryIncidentTypeCode) findings.push({severity:'BLOCKING_ERROR',code:'INCIDENT_TYPE_REQUIRED',message:'Primary incident type is required.',sectionKey:'CLASSIFICATION'})
  if (!incident.dispatchDescription) findings.push({severity:'WARNING',code:'DISPATCH_DESCRIPTION_MISSING',message:'Dispatch description is not recorded.',sectionKey:'OVERVIEW'})
  if (!narrative?.body?.trim()) findings.push({severity:'WARNING',code:'NARRATIVE_MISSING',message:'Incident narrative is not recorded.',sectionKey:'NARRATIVE'})
  const result = {
    ok: !findings.some(x=>x.severity==='BLOCKING_ERROR'),
    findings,
    blockingErrorCount: findings.filter(x=>x.severity==='BLOCKING_ERROR').length,
    warningCount: findings.filter(x=>x.severity==='WARNING').length,
    guidanceCount: findings.filter(x=>x.severity==='GUIDANCE').length
  }
  const runs = readForgeData<Record<string, unknown>[]>('incident-validation-runs')
  writeForgeData('incident-validation-runs',[{id:randomUUID(),incidentId:id,status:result.ok?'PASS':'FAIL',results:findings,createdAt:new Date().toISOString()},...runs])
  return { data: result, source: 'demo' }
}

async function transition(id: string, toStatus: IncidentStatus, actionPath: string, payload?: unknown): Promise<ForgePlatformResult<IncidentRecord>> {
  const mode = getForgePlatformMode()
  if (mode !== 'demo') {
    try {
      return await forgePlatformSend<IncidentRecord>(`${base(id)}/${actionPath}`, 'POST', payload)
    } catch (error) {
      if (!(mode === 'auto' && error instanceof ForgePlatformApiError)) throw error
    }
  }
  const current = rows()
  const index = current.findIndex(x=>x.id===id)
  if(index<0) throw new ForgePlatformApiError('Incident not found.',404,'NOT_FOUND')
  const fromStatus = current[index].status
  const updated = { ...current[index], status: toStatus, recordVersion: current[index].recordVersion + 1, updatedAt: new Date().toISOString() }
  current[index]=updated
  writeRows(current)
  statusHistory(id,fromStatus,toStatus)
  activity(`Incident ${updated.incidentNumber}: ${toStatus.replaceAll('_',' ')}`,id,payload)
  return {data:updated,source:'demo'}
}

export async function submitForReview(id:string,note?:string){ return transition(id,'SUBMITTED_FOR_REVIEW','submit-for-review',{note:note||null}) }
export async function returnForCorrection(id:string,reason:string){ return transition(id,'RETURNED_FOR_CORRECTION','return',{reason,comments:[]}) }
export async function approveIncident(id:string){ return transition(id,'APPROVED','approve') }

export async function listIncidentUnits(id:string): Promise<ForgePlatformResult<Record<string, unknown>[]>> {
  const mode=getForgePlatformMode()
  if(mode==='demo') return {data:readForgeData<Record<string,unknown>[]>('incident-unit-assignments').filter(x=>x.incidentId===id),source:'demo'}
  try{return await forgePlatformGet(`${base(id)}/units`)}catch(error){if(mode==='auto'&&error instanceof ForgePlatformApiError)return {data:readForgeData<Record<string,unknown>[]>('incident-unit-assignments').filter(x=>x.incidentId===id),source:'demo'};throw error}
}
export async function addIncidentUnit(id:string,payload:Record<string,unknown>):Promise<ForgePlatformResult<Record<string,unknown>>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){try{return await forgePlatformSend(`${base(id)}/units`,'POST',payload)}catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}}
  const rows=readForgeData<Record<string,unknown>[]>('incident-unit-assignments');const row={id:randomUUID(),incidentId:id,...payload,recordVersion:1};writeForgeData('incident-unit-assignments',[row,...rows]);return {data:row,source:'demo'}
}
export async function listIncidentPersonnel(id:string): Promise<ForgePlatformResult<Record<string, unknown>[]>> {
  const mode=getForgePlatformMode()
  if(mode==='demo') return {data:readForgeData<Record<string,unknown>[]>('incident-personnel-assignments').filter(x=>x.incidentId===id),source:'demo'}
  try{return await forgePlatformGet(`${base(id)}/personnel`)}catch(error){if(mode==='auto'&&error instanceof ForgePlatformApiError)return {data:readForgeData<Record<string,unknown>[]>('incident-personnel-assignments').filter(x=>x.incidentId===id),source:'demo'};throw error}
}
export async function addIncidentPersonnel(id:string,payload:Record<string,unknown>):Promise<ForgePlatformResult<Record<string,unknown>>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){try{return await forgePlatformSend(`${base(id)}/personnel`,'POST',payload)}catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}}
  const rows=readForgeData<Record<string,unknown>[]>('incident-personnel-assignments');const row={id:randomUUID(),incidentId:id,...payload,recordVersion:1};writeForgeData('incident-personnel-assignments',[row,...rows]);return {data:row,source:'demo'}
}


export async function listReviewComments(id:string):Promise<ForgePlatformResult<Record<string,unknown>[]>>{
  const mode=getForgePlatformMode()
  if(mode==='demo'){
    return {data:readForgeData<Record<string,unknown>[]>('incident-review-comments').filter(x=>x.incidentId===id),source:'demo'}
  }
  try{return await forgePlatformGet(`${base(id)}/review-comments`)}
  catch(error){
    if(mode==='auto'&&error instanceof ForgePlatformApiError){
      return {data:readForgeData<Record<string,unknown>[]>('incident-review-comments').filter(x=>x.incidentId===id),source:'demo'}
    }
    throw error
  }
}

export async function addReviewComment(id:string,body:string):Promise<ForgePlatformResult<Record<string,unknown>>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformSend(`${base(id)}/review-comments`,'POST',{body})}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  if(!body.trim()) throw new ForgePlatformApiError('Review comment is required.',400,'VALIDATION_ERROR')
  const rows=readForgeData<Record<string,unknown>[]>('incident-review-comments')
  const row={id:randomUUID(),incidentId:id,body:body.trim(),authorUserId:'demo-user',status:'OPEN',createdAt:new Date().toISOString()}
  writeForgeData('incident-review-comments',[row,...rows])
  activity('Incident review comment added',id,{commentId:row.id})
  return {data:row,source:'demo'}
}

export async function listStatusHistory(id:string):Promise<ForgePlatformResult<Record<string,unknown>[]>>{
  const mode=getForgePlatformMode()
  if(mode==='demo'){
    return {data:readForgeData<Record<string,unknown>[]>('incident-status-history').filter(x=>x.incidentId===id),source:'demo'}
  }
  try{return await forgePlatformGet(`${base(id)}/status-history`)}
  catch(error){
    if(mode==='auto'&&error instanceof ForgePlatformApiError){
      return {data:readForgeData<Record<string,unknown>[]>('incident-status-history').filter(x=>x.incidentId===id),source:'demo'}
    }
    throw error
  }
}
