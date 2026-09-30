import 'server-only'

import { randomUUID } from 'node:crypto'
import { readForgeData, writeForgeData } from '@/utils/forgeDataStore'
import { createRmsMasterData, deleteRmsMasterData, getRmsMasterData, listRmsMasterData, updateRmsMasterData } from '@/lib/forge-platform/rms'
import { ForgePlatformApiError, forgePlatformGet, forgePlatformSend, getForgePlatformMode, getForgeTenantId, type ForgePlatformResult } from '@/lib/forge-platform/server'

export type Hydrant=Record<string,unknown>&{id:string;recordVersion?:number;displayId?:string;address?:string;addressLine1?:string;provider?:string;waterProvider?:string;waterAssoc?:string;waterAssociation?:string;status?:string}
export type HydrantRecordType='flow-tests'|'inspections'|'damage'

function platformStatus(value:unknown){
  const status=String(value||'').trim().toLowerCase().replaceAll('_',' ')
  if(status==='in service')return 'IN_SERVICE'
  if(status==='out of service')return 'OUT_OF_SERVICE'
  if(status==='needs repair')return 'NEEDS_REPAIR'
  return 'UNKNOWN'
}
function displayStatus(value:unknown){
  const status=String(value||'').trim().toUpperCase().replaceAll(' ','_')
  if(status==='IN_SERVICE')return 'In Service'
  if(status==='OUT_OF_SERVICE')return 'Out of Service'
  if(status==='NEEDS_REPAIR')return 'Needs Repair'
  return value?String(value):'Unknown'
}
function fromPlatform<T extends Record<string,unknown>>(row:T):T{
  return {...row,address:row.address??row.addressLine1,provider:row.provider??row.waterProvider,waterAssoc:row.waterAssoc??row.waterAssociation,status:displayStatus(row.status)} as T
}
function toPlatform(payload:Record<string,unknown>){
  const out={...payload}
  if('address'in out){out.addressLine1=out.address;delete out.address}
  if('provider'in out){out.waterProvider=out.provider;delete out.provider}
  if('waterAssoc'in out){out.waterAssociation=out.waterAssoc;delete out.waterAssoc}
  if('status'in out)out.status=platformStatus(out.status)
  if(typeof out.dischargeSize==='string'&&out.dischargeSize)out.dischargeSize=Number(out.dischargeSize)
  return out
}

export async function listHydrants(){const result=await listRmsMasterData<Hydrant>('hydrants',{pageSize:200});return {...result,data:result.data.map(fromPlatform)}}
export async function getHydrant(id:string){const result=await getRmsMasterData<Hydrant>('hydrants',id);return {...result,data:fromPlatform(result.data)}}
export async function createHydrant(payload:Record<string,unknown>){const result=await createRmsMasterData('hydrants',toPlatform(payload));return {...result,data:fromPlatform(result.data)}}
export async function updateHydrant(id:string,payload:Record<string,unknown>,recordVersion:number){const result=await updateRmsMasterData('hydrants',id,toPlatform(payload),recordVersion);return {...result,data:fromPlatform(result.data)}}
export async function deleteHydrant(id:string,recordVersion:number){return deleteRmsMasterData('hydrants',id,recordVersion)}

function entity(type:HydrantRecordType){return type==='flow-tests'?'hydrant-flow-tests':type==='inspections'?'hydrant-inspections':'hydrant-damage-reports'}
function platformRecordPath(id:string,type:HydrantRecordType){
  const suffix=type==='damage'?'damage-reports':type
  return `/api/v1/tenants/${getForgeTenantId()}/rms/hydrants/${id}/${suffix}`
}
function normalizeRecordPayload(type:HydrantRecordType,payload:Record<string,unknown>){
  const out={...payload}
  if(type==='inspections'&&out.operationalStatus)out.operationalStatus=platformStatus(out.operationalStatus)
  if(type==='damage'&&out.operationalStatus)out.operationalStatus=platformStatus(out.operationalStatus)
  return out
}

export async function listHydrantRecords(id:string,type:HydrantRecordType):Promise<ForgePlatformResult<Record<string,unknown>[]>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformGet<Record<string,unknown>[]>(platformRecordPath(id,type))}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  return {data:readForgeData<Record<string,unknown>[]>(entity(type)).filter(row=>row.hydrantId===id||row.hydrant_id===id),source:'demo'}
}

export async function createHydrantRecord(id:string,type:HydrantRecordType,payload:Record<string,unknown>):Promise<ForgePlatformResult<Record<string,unknown>>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{
      const result=await forgePlatformSend<Record<string,unknown>>(platformRecordPath(id,type),'POST',normalizeRecordPayload(type,payload),{idempotencyKey:`responder-hydrant-${type}-${randomUUID()}`})
      const record=(result.data.flowTest||result.data.inspection||result.data.damageReport||result.data) as Record<string,unknown>
      return {data:record,source:'platform'}
    }catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }

  const hydrants=readForgeData<Hydrant[]>('hydrants')
  const index=hydrants.findIndex(row=>row.id===id)
  if(index<0)throw new ForgePlatformApiError('Hydrant not found.',404,'NOT_FOUND')
  const now=new Date().toISOString()
  const records=readForgeData<Record<string,unknown>[]>(entity(type))
  const record={id:randomUUID(),hydrantId:id,...payload,createdAt:now,updatedAt:now}
  writeForgeData(entity(type),[record,...records])
  const updated={...hydrants[index],updatedAt:now}
  if(type==='flow-tests')Object.assign(updated,{staticPsi:payload.staticPsi,residualPsi:payload.residualPsi,pitotPsi:payload.pitotPsi,flowGpm:payload.flowGpm,nfpaClass:payload.nfpaClass,nfpaColor:payload.nfpaColor,lastFlowTestAt:now})
  if(type==='inspections'){if(payload.operationalStatus)updated.status=payload.operationalStatus;updated.lastInspectionAt=now}
  if(type==='damage'){if(payload.operationalStatus)updated.status=payload.operationalStatus;updated.lastDamageReportAt=now}
  hydrants[index]=updated;writeForgeData('hydrants',hydrants)
  return {data:record,source:'demo'}
}
