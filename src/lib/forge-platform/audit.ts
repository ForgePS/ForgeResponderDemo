import 'server-only'

import { readForgeData } from '@/utils/forgeDataStore'
import {
  ForgePlatformApiError,
  forgePlatformGet,
  getForgePlatformMode,
  getForgeTenantId,
  type ForgePlatformResult
} from '@/lib/forge-platform/server'

export type IncidentAuditEvent={
  id:string
  action:string
  resourceType:string
  resourceId:string|null
  result:string
  riskLevel?:string|null
  actorType?:string|null
  actorUserId?:string|null
  occurredAt:string
  beforeJson?:unknown
  afterJson?:unknown
  metadataJson?:unknown
}

export async function listIncidentAuditEvents(incidentId:string):Promise<ForgePlatformResult<IncidentAuditEvent[]>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{
      const result=await forgePlatformGet<Array<Record<string,unknown>>>(
        `/api/v1/tenants/${getForgeTenantId()}/audit-events`,
        {page:1,pageSize:200}
      )
      const rows=result.data
        .filter(row=>String(row.resourceId||'')===incidentId)
        .map(row=>({
          id:String(row.id),
          action:String(row.action||'audit.event'),
          resourceType:String(row.resourceType||'incident'),
          resourceId:row.resourceId?String(row.resourceId):null,
          result:String(row.result||'SUCCESS'),
          riskLevel:row.riskLevel?String(row.riskLevel):null,
          actorType:row.actorType?String(row.actorType):null,
          actorUserId:row.actorUserId?String(row.actorUserId):null,
          occurredAt:String(row.occurredAt||new Date().toISOString()),
          beforeJson:row.beforeJson,
          afterJson:row.afterJson,
          metadataJson:row.metadataJson
        }))
      return {data:rows,source:'platform'}
    }catch(error){
      if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error
    }
  }

  const rows=readForgeData<Array<Record<string,unknown>>>('activity-events')
    .filter(row=>String(row.resourceId||'')===incidentId)
    .map(row=>({
      id:String(row.id),
      action:String(row.title||row.type||'Incident activity'),
      resourceType:String(row.resourceType||'incident'),
      resourceId:incidentId,
      result:'SUCCESS',
      riskLevel:null,
      actorType:'DEMO',
      actorUserId:null,
      occurredAt:String(row.occurredAt||new Date().toISOString()),
      metadataJson:row.detail
    }))
    .sort((a,b)=>Date.parse(b.occurredAt)-Date.parse(a.occurredAt))
  return {data:rows,source:'demo'}
}
