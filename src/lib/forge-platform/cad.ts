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

export type CadConflict={
  id:string
  incidentId:string|null
  conflictType:string
  status:string
  severity:string
  fieldIdentifier:string|null
  resolutionReason:string|null
  recordVersion:number
  createdAt:string
}

export type CadIncidentStatus={
  links:Array<{
    id:string
    cadConnectionId:string
    sourceIncidentId:string
    sourceIncidentNumber:string|null
    linkStatus:string
    linkMethod:string
    recordVersion:number
    updatedAt:string
  }>
  openConflicts:CadConflict[]
  operatingHints:{linked:boolean;conflictCount:number}
}

export async function getCadIncidentStatus(incidentId:string):Promise<ForgePlatformResult<CadIncidentStatus>>{
  const mode=getForgePlatformMode()
  if(mode==='demo'){
    const links=readForgeData<Array<Record<string,unknown>>>('cad-incident-links')
      .filter(row=>row.incidentId===incidentId&&['ACTIVE','SUSPENDED','CONFLICT'].includes(String(row.linkStatus||'ACTIVE')))
      .map(row=>({
        id:String(row.id),
        cadConnectionId:String(row.cadConnectionId||''),
        sourceIncidentId:String(row.sourceIncidentId||''),
        sourceIncidentNumber:row.sourceIncidentNumber?String(row.sourceIncidentNumber):null,
        linkStatus:String(row.linkStatus||'ACTIVE'),
        linkMethod:String(row.linkMethod||'MANUAL'),
        recordVersion:Number(row.recordVersion||1),
        updatedAt:String(row.updatedAt||row.createdAt||new Date().toISOString())
      }))
    const openConflicts=readForgeData<CadConflict[]>('cad-conflicts')
      .filter(row=>row.incidentId===incidentId&&(row.status==='OPEN'||row.status==='ESCALATED'))
    return {
      data:{links,openConflicts,operatingHints:{linked:links.some(link=>link.linkStatus==='ACTIVE'),conflictCount:openConflicts.length}},
      source:'demo'
    }
  }
  try{
    return await forgePlatformGet<CadIncidentStatus>(
      `/api/v1/tenants/${getForgeTenantId()}/neris/incidents/${incidentId}/cad-status`
    )
  }catch(error){
    if(mode==='auto'&&error instanceof ForgePlatformApiError){
      const links=readForgeData<Array<Record<string,unknown>>>('cad-incident-links')
        .filter(row=>row.incidentId===incidentId&&['ACTIVE','SUSPENDED','CONFLICT'].includes(String(row.linkStatus||'ACTIVE')))
        .map(row=>({
          id:String(row.id),
          cadConnectionId:String(row.cadConnectionId||''),
          sourceIncidentId:String(row.sourceIncidentId||''),
          sourceIncidentNumber:row.sourceIncidentNumber?String(row.sourceIncidentNumber):null,
          linkStatus:String(row.linkStatus||'ACTIVE'),
          linkMethod:String(row.linkMethod||'MANUAL'),
          recordVersion:Number(row.recordVersion||1),
          updatedAt:String(row.updatedAt||row.createdAt||new Date().toISOString())
        }))
      const openConflicts=readForgeData<CadConflict[]>('cad-conflicts')
        .filter(row=>row.incidentId===incidentId&&(row.status==='OPEN'||row.status==='ESCALATED'))
      return {
        data:{links,openConflicts,operatingHints:{linked:links.some(link=>link.linkStatus==='ACTIVE'),conflictCount:openConflicts.length}},
        source:'demo'
      }
    }
    throw error
  }
}


export type CadConnection={
  id:string
  publicId:string
  name:string
  vendor:string
  adapterKey:string
  adapterVersion:string
  environment:string
  transportType:string
  status:string
  intakeMode:string
  healthStatus:string
  recordVersion:number
  hasCredentialsSecret:boolean
  hasWebhookSecret:boolean
  webhookKeyId?:string|null
  lastMessageAt?:string|null
  lastSuccessAt?:string|null
  lastErrorSummary?:string|null
  updatedAt:string
}

export type CadOperationsSummary={
  connections:CadConnection[]
  messages:{received:number;applied:number;duplicates:number;failed:number;deadLetter:number;requiresReview:number;byStatus:Record<string,number>}
  openConflicts:number
  unmappedValues:number
  unknownUnits:number
  unknownPersonnel:number
  activeLinks:number
}

export type CadUnmappedValue={id:string;category:string;sourceField:string;sourceValue:string;occurrenceCount:number;status:string;recordVersion:number;lastSeenAt:string}
export type CadUnknownUnit={id:string;sourceUnitId:string;sourceUnitCallsign:string|null;occurrenceCount:number;status:string;recordVersion:number;lastSeenAt:string}
export type CadUnknownPersonnel={id:string;sourcePersonnelId:string;sourceName:string|null;occurrenceCount:number;status:string;recordVersion:number;lastSeenAt:string}
export type CadRawMessageMeta={id:string;receivedAt:string;transportType:string;sourceMessageId:string|null;sourceIncidentId:string|null;processingStatus:string;authenticationStatus:string;payloadSizeBytes:number|null;payloadHash:string|null;correlationId:string|null;cadConnectionId:string}

function tenantBase(){return `/api/v1/tenants/${getForgeTenantId()}`}
function local<T>(entity:string){return readForgeData<T[]>(entity)}

export async function getCadOperationsSummary():Promise<ForgePlatformResult<CadOperationsSummary>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformGet<CadOperationsSummary>(`${tenantBase()}/cad/operations/summary`)}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  const connections=local<CadConnection>('cad-connections')
  const messages=local<CadRawMessageMeta>('cad-messages')
  const byStatus:Record<string,number>={}
  for(const message of messages)byStatus[message.processingStatus]=(byStatus[message.processingStatus]||0)+1
  return {data:{
    connections,
    messages:{
      received:messages.length,
      applied:byStatus.APPLIED||0,
      duplicates:byStatus.DUPLICATE||0,
      failed:byStatus.FAILED||0,
      deadLetter:byStatus.DEAD_LETTER||0,
      requiresReview:byStatus.REQUIRES_REVIEW||0,
      byStatus
    },
    openConflicts:local<CadConflict>('cad-conflicts').filter(x=>x.status==='OPEN').length,
    unmappedValues:local<CadUnmappedValue>('cad-unmapped-values').filter(x=>x.status!=='RESOLVED').length,
    unknownUnits:local<CadUnknownUnit>('cad-unknown-units').filter(x=>x.status!=='RESOLVED').length,
    unknownPersonnel:local<CadUnknownPersonnel>('cad-unknown-personnel').filter(x=>x.status!=='RESOLVED').length,
    activeLinks:local<Record<string,unknown>>('cad-incident-links').filter(x=>String(x.linkStatus||'ACTIVE')==='ACTIVE').length
  },source:'demo'}
}

export async function listCadConnections():Promise<ForgePlatformResult<CadConnection[]>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformGet<CadConnection[]>(`${tenantBase()}/cad/connections`)}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  return {data:local<CadConnection>('cad-connections'),source:'demo'}
}

export async function createCadConnection(payload:Record<string,unknown>):Promise<ForgePlatformResult<CadConnection>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformSend<CadConnection>(`${tenantBase()}/cad/connections`,'POST',payload)}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  const rows=local<CadConnection>('cad-connections')
  const now=new Date().toISOString()
  const row:CadConnection={
    id:randomUUID(),
    publicId:String(payload.publicId||randomUUID()),
    name:String(payload.name||'CAD Connection'),
    vendor:String(payload.vendor||'GENERIC'),
    adapterKey:String(payload.adapterKey||'generic'),
    adapterVersion:String(payload.adapterVersion||'1.0'),
    environment:String(payload.environment||'SIMULATOR'),
    transportType:String(payload.transportType||'SYNTHETIC_SIMULATOR'),
    status:'DISABLED',
    intakeMode:String(payload.intakeMode||'HYBRID'),
    healthStatus:'UNKNOWN',
    recordVersion:1,
    hasCredentialsSecret:false,
    hasWebhookSecret:false,
    updatedAt:now
  }
  writeForgeData('cad-connections',[row,...rows])
  return {data:row,source:'demo'}
}

export async function setCadConnectionEnabled(id:string,enabled:boolean):Promise<ForgePlatformResult<CadConnection>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformSend<CadConnection>(`${tenantBase()}/cad/connections/${id}/${enabled?'enable':'disable'}`,'POST')}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  const rows=local<CadConnection>('cad-connections');const index=rows.findIndex(x=>x.id===id)
  if(index<0)throw new ForgePlatformApiError('CAD connection not found.',404,'NOT_FOUND')
  const current=rows[index]
  const updated={...current,status:enabled?'ACTIVE':'DISABLED',recordVersion:current.recordVersion+1,updatedAt:new Date().toISOString()}
  rows[index]=updated;writeForgeData('cad-connections',rows)
  return {data:updated,source:'demo'}
}

export async function testCadConnection(id:string):Promise<ForgePlatformResult<{healthy:boolean;status:string;checkedAt:string;connection:CadConnection}>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformSend(`${tenantBase()}/cad/connections/${id}/test`,'POST')}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  const rows=local<CadConnection>('cad-connections');const connection=rows.find(x=>x.id===id)
  if(!connection)throw new ForgePlatformApiError('CAD connection not found.',404,'NOT_FOUND')
  const checkedAt=new Date().toISOString()
  const updated={...connection,healthStatus:'HEALTHY',lastSuccessAt:checkedAt,updatedAt:checkedAt}
  writeForgeData('cad-connections',rows.map(x=>x.id===id?updated:x))
  return {data:{healthy:true,status:'HEALTHY',checkedAt,connection:updated},source:'demo'}
}

export async function listCadConflicts(query:Record<string,string>={}):Promise<ForgePlatformResult<CadConflict[]>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformGet<CadConflict[]>(`${tenantBase()}/cad/conflicts`,query)}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  let rows=local<CadConflict>('cad-conflicts')
  if(query.status)rows=rows.filter(x=>x.status===query.status)
  if(query.incidentId)rows=rows.filter(x=>x.incidentId===query.incidentId)
  return {data:rows,source:'demo'}
}

export async function resolveCadConflict(id:string,payload:{resolutionAction:string;resolutionReason:string;recordVersion:number}):Promise<ForgePlatformResult<CadConflict>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformSend<CadConflict>(`${tenantBase()}/cad/conflicts/${id}/resolve`,'POST',payload)}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  const rows=local<CadConflict>('cad-conflicts');const index=rows.findIndex(x=>x.id===id)
  if(index<0)throw new ForgePlatformApiError('CAD conflict not found.',404,'NOT_FOUND')
  if(rows[index].recordVersion!==payload.recordVersion)throw new ForgePlatformApiError('CAD conflict was modified elsewhere.',412,'PRECONDITION_FAILED')
  const updated={...rows[index],status:payload.resolutionAction==='ESCALATE'?'ESCALATED':'MANUALLY_RESOLVED',resolutionReason:payload.resolutionReason,recordVersion:rows[index].recordVersion+1}
  rows[index]=updated;writeForgeData('cad-conflicts',rows)
  return {data:updated,source:'demo'}
}

export async function listCadUnmappedValues():Promise<ForgePlatformResult<CadUnmappedValue[]>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformGet<CadUnmappedValue[]>(`${tenantBase()}/cad/unmapped-values`)}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  return {data:local<CadUnmappedValue>('cad-unmapped-values'),source:'demo'}
}

export async function resolveCadUnmappedValue(id:string,payload:{resolutionReason:string;recordVersion:number;status?:string}):Promise<ForgePlatformResult<CadUnmappedValue>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformSend<CadUnmappedValue>(`${tenantBase()}/cad/unmapped-values/${id}/resolve`,'POST',payload)}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  const rows=local<CadUnmappedValue>('cad-unmapped-values');const index=rows.findIndex(x=>x.id===id)
  if(index<0)throw new ForgePlatformApiError('Unmapped CAD value not found.',404,'NOT_FOUND')
  const updated={...rows[index],status:payload.status||'RESOLVED',recordVersion:rows[index].recordVersion+1}
  rows[index]=updated;writeForgeData('cad-unmapped-values',rows);return {data:updated,source:'demo'}
}

export async function listCadUnknownUnits():Promise<ForgePlatformResult<CadUnknownUnit[]>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){try{return await forgePlatformGet<CadUnknownUnit[]>(`${tenantBase()}/cad/unknown-units`)}catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}}
  return {data:local<CadUnknownUnit>('cad-unknown-units'),source:'demo'}
}
export async function resolveCadUnknownUnit(id:string,payload:Record<string,unknown>):Promise<ForgePlatformResult<CadUnknownUnit>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){try{return await forgePlatformSend<CadUnknownUnit>(`${tenantBase()}/cad/unknown-units/${id}/resolve`,'POST',payload)}catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}}
  const rows=local<CadUnknownUnit>('cad-unknown-units');const index=rows.findIndex(x=>x.id===id);if(index<0)throw new ForgePlatformApiError('Unknown CAD unit not found.',404,'NOT_FOUND')
  const current=rows[index]
  const expected=Number(payload.recordVersion||1)
  if(current.recordVersion!==expected)throw new ForgePlatformApiError('Unknown CAD unit was modified elsewhere.',412,'PRECONDITION_FAILED')
  const status=String(payload.status||'MAPPED')
  if(status==='MAPPED'){
    const mappings=local<Record<string,unknown>>('cad-unit-mappings')
    const mapping={id:randomUUID(),sourceUnitId:current.sourceUnitId,sourceUnitCallsign:current.sourceUnitCallsign,forgeApparatusId:payload.forgeApparatusId||null,forgeUnitId:payload.forgeUnitId||null,mappingType:String(payload.mappingType||'APPARATUS'),externalAgency:Boolean(payload.externalAgency),notes:payload.notes||null,status:'ACTIVE',createdAt:new Date().toISOString()}
    writeForgeData('cad-unit-mappings',[mapping,...mappings])
  }
  const updated={...current,status,recordVersion:current.recordVersion+1};rows[index]=updated;writeForgeData('cad-unknown-units',rows);return {data:updated,source:'demo'}
}
export async function listCadUnknownPersonnel():Promise<ForgePlatformResult<CadUnknownPersonnel[]>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){try{return await forgePlatformGet<CadUnknownPersonnel[]>(`${tenantBase()}/cad/unknown-personnel`)}catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}}
  return {data:local<CadUnknownPersonnel>('cad-unknown-personnel'),source:'demo'}
}
export async function resolveCadUnknownPersonnel(id:string,payload:Record<string,unknown>):Promise<ForgePlatformResult<CadUnknownPersonnel>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){try{return await forgePlatformSend<CadUnknownPersonnel>(`${tenantBase()}/cad/unknown-personnel/${id}/resolve`,'POST',payload)}catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}}
  const rows=local<CadUnknownPersonnel>('cad-unknown-personnel');const index=rows.findIndex(x=>x.id===id);if(index<0)throw new ForgePlatformApiError('Unknown CAD personnel not found.',404,'NOT_FOUND')
  const current=rows[index]
  const expected=Number(payload.recordVersion||1)
  if(current.recordVersion!==expected)throw new ForgePlatformApiError('Unknown CAD personnel was modified elsewhere.',412,'PRECONDITION_FAILED')
  const status=String(payload.status||'MAPPED')
  if(status==='MAPPED'){
    const mappings=local<Record<string,unknown>>('cad-personnel-mappings')
    const mapping={id:randomUUID(),sourcePersonnelId:current.sourcePersonnelId,sourceName:current.sourceName,forgePersonId:payload.forgePersonId||null,forgePersonnelId:payload.forgePersonnelId||null,mappingType:String(payload.mappingType||'PERSONNEL'),externalAgency:Boolean(payload.externalAgency),notes:payload.notes||null,status:'ACTIVE',createdAt:new Date().toISOString()}
    writeForgeData('cad-personnel-mappings',[mapping,...mappings])
  }
  const updated={...current,status,recordVersion:current.recordVersion+1};rows[index]=updated;writeForgeData('cad-unknown-personnel',rows);return {data:updated,source:'demo'}
}
export async function listCadMessages():Promise<ForgePlatformResult<CadRawMessageMeta[]>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){try{return await forgePlatformGet<CadRawMessageMeta[]>(`${tenantBase()}/cad/messages`)}catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}}
  return {data:local<CadRawMessageMeta>('cad-messages'),source:'demo'}
}


export async function reprocessCadMessage(id:string,reason:string):Promise<ForgePlatformResult<Record<string,unknown>>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformSend<Record<string,unknown>>(`${tenantBase()}/cad/messages/${id}/reprocess`,'POST',{reason})}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  const rows=local<CadRawMessageMeta>('cad-messages');const index=rows.findIndex(x=>x.id===id)
  if(index<0)throw new ForgePlatformApiError('CAD message not found.',404,'NOT_FOUND')
  const updated={...rows[index],processingStatus:'QUEUED'};rows[index]=updated;writeForgeData('cad-messages',rows)
  return {data:{accepted:true,rawMessageId:id,reason},source:'demo'}
}

export async function replayCadMessages(rawMessageIds:string[],reason:string):Promise<ForgePlatformResult<Record<string,unknown>>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformSend<Record<string,unknown>>(`${tenantBase()}/cad/messages/replay`,'POST',{rawMessageIds,reason})}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  let replayedCount=0
  for(const id of rawMessageIds){try{await reprocessCadMessage(id,reason);replayedCount+=1}catch{}}
  return {data:{accepted:true,replayedCount,skippedCount:rawMessageIds.length-replayedCount},source:'demo'}
}

export async function linkCadIncident(
  incidentId:string,
  payload:{cadConnectionId:string;sourceIncidentId:string;sourceIncidentNumber?:string|null;reason:string;recordVersion?:number}
):Promise<ForgePlatformResult<Record<string,unknown>>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformSend<Record<string,unknown>>(`${tenantBase()}/neris/incidents/${incidentId}/cad-link`,'POST',payload)}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  const rows=local<Record<string,unknown>>('cad-incident-links')
  const now=new Date().toISOString()
  const row={id:randomUUID(),incidentId,...payload,linkStatus:'ACTIVE',linkMethod:'MANUAL',recordVersion:1,createdAt:now,updatedAt:now}
  writeForgeData('cad-incident-links',[row,...rows])
  return {data:row,source:'demo'}
}

export async function unlinkCadIncident(
  incidentId:string,
  payload:{cadIncidentLinkId:string;reason:string;recordVersion:number}
):Promise<ForgePlatformResult<Record<string,unknown>>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformSend<Record<string,unknown>>(`${tenantBase()}/neris/incidents/${incidentId}/cad-unlink`,'POST',payload)}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  const rows=local<Record<string,unknown>>('cad-incident-links');const index=rows.findIndex(x=>x.id===payload.cadIncidentLinkId&&x.incidentId===incidentId)
  if(index<0)throw new ForgePlatformApiError('CAD incident link not found.',404,'NOT_FOUND')
  const current=rows[index]
  if(Number(current.recordVersion||1)!==payload.recordVersion)throw new ForgePlatformApiError('CAD incident link was modified elsewhere.',412,'PRECONDITION_FAILED')
  const updated={...current,linkStatus:'UNLINKED',manualOverrideReason:payload.reason,recordVersion:payload.recordVersion+1,updatedAt:new Date().toISOString()}
  rows[index]=updated;writeForgeData('cad-incident-links',rows);return {data:updated,source:'demo'}
}


export async function patchCadConnection(id:string,payload:Record<string,unknown>,recordVersion:number):Promise<ForgePlatformResult<CadConnection>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformSend<CadConnection>(`${tenantBase()}/cad/connections/${id}`,'PATCH',{...payload,recordVersion})}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  const rows=local<CadConnection>('cad-connections')
  const index=rows.findIndex(x=>x.id===id)
  if(index<0)throw new ForgePlatformApiError('CAD connection not found.',404,'NOT_FOUND')
  if(rows[index].recordVersion!==recordVersion)throw new ForgePlatformApiError('CAD connection was modified elsewhere.',412,'PRECONDITION_FAILED')
  const updated={...rows[index],...payload,id,recordVersion:recordVersion+1,updatedAt:new Date().toISOString()} as CadConnection
  rows[index]=updated
  writeForgeData('cad-connections',rows)
  return {data:updated,source:'demo'}
}


export async function listCadUnitMappings():Promise<ForgePlatformResult<Record<string,unknown>[]>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformGet<Record<string,unknown>[]>(`${tenantBase()}/cad/unit-mappings`)}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  return {data:local<Record<string,unknown>>('cad-unit-mappings'),source:'demo'}
}

export async function listCadPersonnelMappings():Promise<ForgePlatformResult<Record<string,unknown>[]>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformGet<Record<string,unknown>[]>(`${tenantBase()}/cad/personnel-mappings`)}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  return {data:local<Record<string,unknown>>('cad-personnel-mappings'),source:'demo'}
}


export async function listCadSimulatorScenarios():Promise<ForgePlatformResult<Array<Record<string,unknown>>>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformGet<Array<Record<string,unknown>>>(`${tenantBase()}/cad/simulator/scenarios`)}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  return {data:[
    {id:'STRUCTURE_FIRE',label:'Structure Fire',description:'Dispatch, unit assignment, timestamps, location, and fire response fields.'},
    {id:'MEDICAL_AID',label:'Medical Aid',description:'EMS-style CAD incident with unit response and patient-location context.'},
    {id:'MVA',label:'Motor Vehicle Collision',description:'Transportation incident with multiple responding units.'},
    {id:'HAZMAT',label:'Hazardous Materials',description:'Hazmat response with specialty review cues.'}
  ],source:'demo'}
}

export async function sendCadSimulatorScenario(payload:Record<string,unknown>):Promise<ForgePlatformResult<Record<string,unknown>>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformSend<Record<string,unknown>>(`${tenantBase()}/cad/simulator/send`,'POST',payload)}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  const connectionId=String(payload.connectionId||'')
  const connection=local<CadConnection>('cad-connections').find(x=>x.id===connectionId)
  if(!connection)throw new ForgePlatformApiError('CAD connection not found.',404,'NOT_FOUND')
  const now=new Date().toISOString()
  const rawMessageId=randomUUID()
  const sourceIncidentId=String(payload.sourceIncidentId||`SIM-${Date.now()}`)
  const row:CadRawMessageMeta={
    id:rawMessageId,
    receivedAt:now,
    transportType:'SYNTHETIC_SIMULATOR',
    sourceMessageId:`SIM-MSG-${Date.now()}`,
    sourceIncidentId,
    processingStatus:'REQUIRES_REVIEW',
    authenticationStatus:'VERIFIED',
    payloadSizeBytes:1024,
    payloadHash:`demo-${rawMessageId}`,
    correlationId:randomUUID(),
    cadConnectionId:connectionId
  }
  writeForgeData('cad-messages',[row,...local<CadRawMessageMeta>('cad-messages')])
  const connections=local<CadConnection>('cad-connections')
  writeForgeData('cad-connections',connections.map(x=>x.id===connectionId?{...x,lastMessageAt:now,updatedAt:now}:x))
  return {data:{delivery:String(payload.delivery||'DIRECT_QUEUE'),scenarioId:String(payload.scenarioId||'STRUCTURE_FIRE'),rawMessageId,payloadPreview:{sourceIncidentId}},source:'demo'}
}

export async function setCadSimulatorOutage(connectionId:string,reason:string,recover=false):Promise<ForgePlatformResult<Record<string,unknown>>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformSend<Record<string,unknown>>(`${tenantBase()}/cad/simulator/${recover?'recover':'outage'}`,'POST',{connectionId,reason})}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  const rows=local<CadConnection>('cad-connections')
  const index=rows.findIndex(x=>x.id===connectionId)
  if(index<0)throw new ForgePlatformApiError('CAD connection not found.',404,'NOT_FOUND')
  const now=new Date().toISOString()
  const updated={...rows[index],status:recover?'ACTIVE':'DEGRADED',healthStatus:recover?'HEALTHY':'DEGRADED',lastErrorSummary:recover?null:reason,lastSuccessAt:recover?now:rows[index].lastSuccessAt,recordVersion:rows[index].recordVersion+1,updatedAt:now}
  rows[index]=updated
  writeForgeData('cad-connections',rows)
  return {data:recover?{recovered:true,connection:updated}:{outageId:randomUUID(),connection:updated},source:'demo'}
}
