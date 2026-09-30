import 'server-only'

import { randomUUID } from 'node:crypto'

import { readForgeData, writeForgeData } from '@/utils/forgeDataStore'
import {
  ForgePlatformApiError,
  forgePlatformGet,
  forgePlatformSend,
  getForgePlatformMode,
  getForgeTenantId,
  type ForgePlatformResult
} from '@/lib/forge-platform/server'

export type SpecialtyKind =
  | 'exposures'
  | 'civilian-casualties'
  | 'fire-service-casualties'
  | 'hazmat-substances'
  | 'hazmat-containers'
  | 'alarm-systems'
  | 'protection-systems'
  | 'attachments'

const config:Record<SpecialtyKind,{entity:string;path:string}> = {
  exposures:{entity:'incident-exposures',path:'exposures'},
  'civilian-casualties':{entity:'incident-civilian-casualties',path:'civilian-casualties'},
  'fire-service-casualties':{entity:'incident-fire-service-casualties',path:'fire-service-casualties'},
  'hazmat-substances':{entity:'incident-hazmat-substances',path:'hazmat/substances'},
  'hazmat-containers':{entity:'incident-hazmat-containers',path:'hazmat/containers'},
  'alarm-systems':{entity:'incident-alarm-systems',path:'alarm-systems'},
  'protection-systems':{entity:'incident-protection-systems',path:'protection-systems'},
  attachments:{entity:'incident-attachments',path:'attachments'}
}

function root(incidentId:string){
  return `/api/v1/tenants/${getForgeTenantId()}/neris/incidents/${incidentId}`
}

function localRows(kind:SpecialtyKind,incidentId:string){
  const entity=config[kind].entity
  return readForgeData<Array<Record<string,unknown>>>(entity).filter(row=>row.incidentId===incidentId)
}

export async function listSpecialtyRecords(kind:SpecialtyKind,incidentId:string):Promise<ForgePlatformResult<Array<Record<string,unknown>>>>{
  const mode=getForgePlatformMode()
  if(mode==='demo')return {data:localRows(kind,incidentId),source:'demo'}
  try{return await forgePlatformGet<Array<Record<string,unknown>>>(`${root(incidentId)}/${config[kind].path}`)}
  catch(error){if(mode==='auto'&&error instanceof ForgePlatformApiError)return {data:localRows(kind,incidentId),source:'demo'};throw error}
}

export async function createSpecialtyRecord(kind:SpecialtyKind,incidentId:string,payload:Record<string,unknown>):Promise<ForgePlatformResult<Record<string,unknown>>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformSend<Record<string,unknown>>(`${root(incidentId)}/${config[kind].path}`,'POST',payload)}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  const entity=config[kind].entity
  const rows=readForgeData<Array<Record<string,unknown>>>(entity)
  const now=new Date().toISOString()
  const row={id:randomUUID(),incidentId,...payload,recordVersion:1,createdAt:now,updatedAt:now,status:'ACTIVE'}
  writeForgeData(entity,[row,...rows])
  return {data:row,source:'demo'}
}

export async function archiveSpecialtyRecord(kind:SpecialtyKind,incidentId:string,id:string):Promise<ForgePlatformResult<Record<string,unknown>>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    const path=config[kind].path
    const archivePath=kind==='attachments'? `${root(incidentId)}/attachments/${id}/archive` : `${root(incidentId)}/${path}/${id}/archive`
    try{return await forgePlatformSend<Record<string,unknown>>(archivePath,'POST')}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  const entity=config[kind].entity
  const rows=readForgeData<Array<Record<string,unknown>>>(entity)
  const index=rows.findIndex(row=>row.id===id&&row.incidentId===incidentId)
  if(index<0)throw new ForgePlatformApiError('Specialty record not found.',404,'NOT_FOUND')
  const current=rows[index]
  const updated={...current,status:'ARCHIVED',archivedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),recordVersion:Number(current.recordVersion||1)+1}
  rows[index]=updated
  writeForgeData(entity,rows)
  return {data:updated,source:'demo'}
}
