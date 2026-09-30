import 'server-only'

import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

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
  if(kind==='attachments'&&getForgePlatformMode()!=='demo')throw new ForgePlatformApiError('Connected attachments must use the upload workflow.',400,'USE_ATTACHMENT_UPLOAD')
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


export async function uploadIncidentAttachment(
  incidentId:string,
  file:File,
  meta:{category:string;caption?:string;specialtySection?:string;securityClassification?:string}
):Promise<ForgePlatformResult<Record<string,unknown>>>{
  const mode=getForgePlatformMode()
  const allowed=new Set(['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf','image/gif'])
  if(!allowed.has(file.type))throw new ForgePlatformApiError(`File type not allowed: ${file.type}`,400,'BAD_REQUEST')
  if(file.size>50*1024*1024)throw new ForgePlatformApiError('File exceeds 50 MB limit.',400,'BAD_REQUEST')

  if(mode!=='demo'){
    try{
      const init=await forgePlatformSend<Record<string,unknown>>(
        `${root(incidentId)}/attachments/uploads`,
        'POST',
        {
          category:meta.category||'OTHER',
          caption:meta.caption||null,
          specialtySection:meta.specialtySection||null,
          originalFilename:file.name,
          mimeType:file.type,
          fileSizeBytes:file.size,
          source:'RMS_WEB',
          securityClassification:meta.securityClassification||'INTERNAL'
        }
      )
      const uploadUrl=String(init.data.uploadUrl||'')
      const attachmentId=String(init.data.attachmentId||'')
      if(!uploadUrl||!attachmentId)throw new ForgePlatformApiError('Forge Platform did not return an upload URL.',502,'UPLOAD_INIT_FAILED')
      const bytes=Buffer.from(await file.arrayBuffer())
      const upload=await fetch(uploadUrl,{method:'PUT',headers:{'Content-Type':file.type,'Content-Length':String(file.size)},body:bytes})
      if(!upload.ok)throw new ForgePlatformApiError(`Object upload failed with HTTP ${upload.status}.`,upload.status,'OBJECT_UPLOAD_FAILED')
      const complete=await forgePlatformSend<Record<string,unknown>>(
        `${root(incidentId)}/attachments/${attachmentId}/complete`,
        'POST',
        {}
      )
      return complete
    }catch(error){
      if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error
    }
  }

  const dir=path.join(process.cwd(),'demo-persistence','attachments',incidentId)
  fs.mkdirSync(dir,{recursive:true})
  const safeName=file.name.replace(/[^a-zA-Z0-9._-]+/g,'_')
  const storedName=`${randomUUID()}-${safeName}`
  const target=path.join(dir,storedName)
  fs.writeFileSync(target,Buffer.from(await file.arrayBuffer()))
  const rows=readForgeData<Array<Record<string,unknown>>>('incident-attachments')
  const now=new Date().toISOString()
  const row={
    id:randomUUID(),
    incidentId,
    category:meta.category||'OTHER',
    caption:meta.caption||null,
    specialtySection:meta.specialtySection||null,
    originalFilename:file.name,
    storedFilename:storedName,
    mimeType:file.type,
    fileSizeBytes:file.size,
    securityClassification:meta.securityClassification||'INTERNAL',
    uploadStatus:'COMPLETE',
    malwareScanStatus:'DEMO_NOT_SCANNED',
    source:'RMS_WEB',
    recordVersion:1,
    createdAt:now,
    updatedAt:now
  }
  writeForgeData('incident-attachments',[row,...rows])
  return {data:row,source:'demo'}
}


export async function patchSpecialtyRecord(
  kind:SpecialtyKind,
  incidentId:string,
  id:string,
  payload:Record<string,unknown>,
  recordVersion:number
):Promise<ForgePlatformResult<Record<string,unknown>>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    const path=config[kind].path
    const target=kind==='attachments'
      ? `${root(incidentId)}/attachments/${id}`
      : `${root(incidentId)}/${path}/${id}`
    try{
      return await forgePlatformSend<Record<string,unknown>>(target,'PATCH',payload,{ifMatch:recordVersionToIfMatch(recordVersion)})
    }catch(error){
      if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error
    }
  }

  const entity=config[kind].entity
  const rows=readForgeData<Array<Record<string,unknown>>>(entity)
  const index=rows.findIndex(row=>row.id===id&&row.incidentId===incidentId)
  if(index<0)throw new ForgePlatformApiError('Specialty record not found.',404,'NOT_FOUND')
  const current=rows[index]
  const currentVersion=Number(current.recordVersion||1)
  if(currentVersion!==recordVersion)throw new ForgePlatformApiError('Specialty record was modified elsewhere.',412,'PRECONDITION_FAILED')
  const updated={...current,...payload,id,incidentId,recordVersion:currentVersion+1,updatedAt:new Date().toISOString()}
  rows[index]=updated
  writeForgeData(entity,rows)
  return {data:updated,source:'demo'}
}
