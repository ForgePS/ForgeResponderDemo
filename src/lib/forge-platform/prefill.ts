import 'server-only'

import { getIncident, patchIncident } from '@/lib/forge-platform/incidents'
import { getCadIncidentStatus } from '@/lib/forge-platform/cad'
import { getFormDescriptor, batchFieldValues, type NerisFieldValueState } from '@/lib/forge-platform/neris'
import { listRmsMasterData } from '@/lib/forge-platform/rms'
import {
  ForgePlatformApiError,
  forgePlatformGet,
  getForgePlatformMode,
  getForgeTenantId,
  type ForgePlatformResult
} from '@/lib/forge-platform/server'

export type PrefillSource='TENANT_DEFAULT'|'USER_DEFAULT'|'ROSTER'|'PERSONNEL'|'APPARATUS'|'OCCUPANCY'|'PREPLAN'|'MANUAL'|'COMPUTED'|'CAD'|'FUTURE_CAD'

export type PrefillCandidate={
  fieldKey:string
  sectionKey:string
  value:unknown
  prefillSource:PrefillSource
  informational?:boolean
  label?:string
}

type MasterRow=Record<string,unknown>&{id:string}

function base(id:string){return `/api/v1/tenants/${getForgeTenantId()}/neris/incidents/${id}/prefill`}

async function localCandidates(
  incidentId:string,
  query:{stationId?:string;personnelId?:string;occupancyId?:string;preplanId?:string}
):Promise<PrefillCandidate[]>{
  const incident=(await getIncident(incidentId)).data
  const [stations,personnel,occupancies,preplans,cad]=await Promise.all([
    listRmsMasterData<MasterRow>('stations'),
    listRmsMasterData<MasterRow>('personnel'),
    listRmsMasterData<MasterRow>('occupancies'),
    listRmsMasterData<MasterRow>('preplans'),
    getCadIncidentStatus(incidentId)
  ])
  const out:PrefillCandidate[]=[]
  const stationId=query.stationId||incident.stationId||''
  const personId=query.personnelId||incident.incidentCommanderPersonnelId||''
  const station=stations.data.find(row=>row.id===stationId)
  if(station){
    if(station.defaultResponseDistrict)out.push({fieldKey:'response_district',sectionKey:'OVERVIEW',value:station.defaultResponseDistrict,prefillSource:'TENANT_DEFAULT',label:'Response District'})
    if(station.timezone)out.push({fieldKey:'station_timezone',sectionKey:'OVERVIEW',value:station.timezone,prefillSource:'TENANT_DEFAULT',label:'Station Timezone'})
  }
  const person=personnel.data.find(row=>row.id===personId)
  if(person?.rank)out.push({fieldKey:'personnel_rank',sectionKey:'UNITS_PERSONNEL',value:person.rank,prefillSource:'PERSONNEL',label:'Personnel Rank'})
  if(query.occupancyId){
    const occupancy=occupancies.data.find(row=>row.id===query.occupancyId)
    if(occupancy){
      if(occupancy.name)out.push({fieldKey:'location_name',sectionKey:'LOCATION',value:occupancy.name,prefillSource:'OCCUPANCY',label:'Location Name'})
      if(occupancy.addressLine1)out.push({fieldKey:'address_line1',sectionKey:'LOCATION',value:occupancy.addressLine1,prefillSource:'OCCUPANCY',label:'Street Address'})
      if(occupancy.city)out.push({fieldKey:'city',sectionKey:'LOCATION',value:occupancy.city,prefillSource:'OCCUPANCY',label:'City'})
      if(occupancy.state)out.push({fieldKey:'state',sectionKey:'LOCATION',value:occupancy.state,prefillSource:'OCCUPANCY',label:'State'})
      if(occupancy.postalCode)out.push({fieldKey:'postal_code',sectionKey:'LOCATION',value:occupancy.postalCode,prefillSource:'OCCUPANCY',label:'Postal Code'})
    }
  }
  if(query.preplanId){
    const preplan=preplans.data.find(row=>row.id===query.preplanId)
    if(preplan?.tacticalSummary)out.push({fieldKey:'tactical_summary',sectionKey:'LOCATION',value:preplan.tacticalSummary,prefillSource:'PREPLAN',label:'Tactical Summary'})
  }
  for(const link of cad.data.links){
    out.push({fieldKey:'cad_source_incident_id',sectionKey:'DISPATCH',value:link.sourceIncidentId,prefillSource:'CAD',informational:true,label:'CAD Source Incident ID'})
    if(link.sourceIncidentNumber)out.push({fieldKey:'cad_source_incident_number',sectionKey:'DISPATCH',value:link.sourceIncidentNumber,prefillSource:'CAD',informational:true,label:'CAD Source Incident Number'})
  }
  return out.filter(candidate=>candidate.value!==null&&candidate.value!==undefined&&candidate.value!=='')
}

export async function getIncidentPrefill(
  incidentId:string,
  query:{stationId?:string;personnelId?:string;occupancyId?:string;preplanId?:string}={}
):Promise<ForgePlatformResult<PrefillCandidate[]>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{
      const result=await forgePlatformGet<PrefillCandidate[]>(base(incidentId),query as Record<string,string>)
      const cad=await getCadIncidentStatus(incidentId)
      const context:PrefillCandidate[]=cad.data.links.flatMap(link=>[
        {fieldKey:'cad_source_incident_id',sectionKey:'DISPATCH',value:link.sourceIncidentId,prefillSource:'CAD' as const,informational:true,label:'CAD Source Incident ID'},
        ...(link.sourceIncidentNumber?[{fieldKey:'cad_source_incident_number',sectionKey:'DISPATCH',value:link.sourceIncidentNumber,prefillSource:'CAD' as const,informational:true,label:'CAD Source Incident Number'}]:[])
      ])
      return {data:[...result.data,...context],source:'platform'}
    }catch(error){
      if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error
    }
  }
  return {data:await localCandidates(incidentId,query),source:'demo'}
}

function stateFor(value:unknown):NerisFieldValueState{
  if(typeof value==='boolean')return {valueBoolean:value}
  if(typeof value==='number')return {valueNumber:value}
  if(typeof value==='string'){
    const date=Date.parse(value)
    if(/T/.test(value)&&Number.isFinite(date))return {valueTimestamp:new Date(date).toISOString()}
    return {valueText:value}
  }
  return {valueJson:value}
}

export async function applyIncidentPrefill(
  incidentId:string,
  candidates:PrefillCandidate[],
  recordVersion:number
):Promise<ForgePlatformResult<{incident:Awaited<ReturnType<typeof getIncident>>['data'];applied:number;skipped:number}>>{
  const incidentResult=await getIncident(incidentId)
  let incident=incidentResult.data
  if(incident.recordVersion!==recordVersion)throw new ForgePlatformApiError('Incident was modified before prefill could be applied.',412,'PRECONDITION_FAILED')

  let applied=0
  let skipped=0
  const header:Record<string,unknown>={}
  const dynamic:PrefillCandidate[]=[]

  for(const candidate of candidates){
    if(candidate.informational){skipped+=1;continue}
    if(candidate.fieldKey==='response_district'){
      if(!incident.responseDistrict){header.responseDistrict=candidate.value;applied+=1}else skipped+=1
      continue
    }
    dynamic.push(candidate)
  }

  if(Object.keys(header).length){
    const patched=await patchIncident(incidentId,header,incident.recordVersion)
    incident=patched.data
  }

  if(dynamic.length){
    const descriptor=(await getFormDescriptor(incidentId)).data
    const fieldMap=new Map(descriptor.modules.flatMap(module=>module.fields).map(field=>[field.fieldKey,field]))
    const values:Array<{fieldId:string;fieldKey?:string;sectionKey:string}&NerisFieldValueState>=[]
    for(const candidate of dynamic){
      const field=fieldMap.get(candidate.fieldKey)
      if(!field){skipped+=1;continue}
      values.push({
        fieldId:field.fieldId,
        fieldKey:field.fieldKey,
        sectionKey:candidate.sectionKey||descriptor.modules.find(module=>module.fields.some(f=>f.fieldId===field.fieldId))?.sectionKey||'OVERVIEW',
        ...stateFor(candidate.value),
        prefillSource:candidate.prefillSource,
        userConfirmed:false
      })
    }
    if(values.length){
      const result=await batchFieldValues(incidentId,values,incident.recordVersion)
      incident=result.data.incident
      applied+=values.length
    }
  }

  return {data:{incident,applied,skipped},source:incidentResult.source}
}
