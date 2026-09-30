import 'server-only'

import {
  addIncidentPersonnel,
  addIncidentUnit,
  getIncident,
  listIncidentPersonnel,
  listIncidentUnits,
  patchIncident
} from '@/lib/forge-platform/incidents'
import {
  getCadIncidentStatus,
  getCadMessageDetail,
  listCadMessages,
  listCadPersonnelMappings,
  listCadUnitMappings
} from '@/lib/forge-platform/cad'
import { getFormDescriptor, batchFieldValues, lookupValueSetOptions, type NerisFieldValueState } from '@/lib/forge-platform/neris'
import { listRmsMasterData } from '@/lib/forge-platform/rms'
import {
  ForgePlatformApiError,
  forgePlatformGet,
  getForgePlatformMode,
  getForgeTenantId,
  type ForgePlatformResult
} from '@/lib/forge-platform/server'

export type PrefillSource='TENANT_DEFAULT'|'USER_DEFAULT'|'ROSTER'|'PERSONNEL'|'APPARATUS'|'OCCUPANCY'|'PREPLAN'|'MANUAL'|'COMPUTED'|'CAD'|'FUTURE_CAD'
export type PrefillTarget='FIELD'|'INCIDENT'|'UNIT_ASSIGNMENT'|'PERSONNEL_ASSIGNMENT'|'CONTEXT'

export type PrefillCandidate={
  fieldKey:string
  sectionKey:string
  value:unknown
  prefillSource:PrefillSource
  target?:PrefillTarget
  informational?:boolean
  label?:string
  sourceMessageId?:string|null
  sourceEventId?:string|null
}

type MasterRow=Record<string,unknown>&{id:string}
type Query={stationId?:string;personnelId?:string;occupancyId?:string;preplanId?:string}
type CadPayload={
  source?:Record<string,unknown>
  eventType?:string
  incident?:Record<string,unknown>
  location?:Record<string,unknown>
  timestamps?:Record<string,unknown>
  units?:Array<Record<string,unknown>>
  personnel?:Array<Record<string,unknown>>
  comments?:Array<Record<string,unknown>>
  disposition?:Record<string,unknown>
}

function base(id:string){return `/api/v1/tenants/${getForgeTenantId()}/neris/incidents/${id}/prefill`}
function useful(value:unknown){return value!==null&&value!==undefined&&value!==''}
function text(value:unknown){return useful(value)?String(value):''}

function push(
  out:PrefillCandidate[],
  candidate:PrefillCandidate
){
  if(!useful(candidate.value))return
  out.push({...candidate,target:candidate.target||'FIELD'})
}

function splitAddress(address:string){
  const parts=address.trim().split(/\s+/).filter(Boolean)
  if(parts.length<2)return {number:'',street:address,streetType:''}
  const number=parts[0]
  const streetType=parts.length>2?parts[parts.length-1]:''
  const street=parts.length>2?parts.slice(1,-1).join(' '):parts.slice(1).join(' ')
  return {number,street,streetType}
}

async function cadCandidates(incidentId:string):Promise<PrefillCandidate[]>{
  const out:PrefillCandidate[]=[]
  const [cadStatus,messages,unitMappings,personnelMappings]=await Promise.all([
    getCadIncidentStatus(incidentId),
    listCadMessages(),
    listCadUnitMappings(),
    listCadPersonnelMappings()
  ])

  const activeLinks=cadStatus.data.links.filter(link=>link.linkStatus==='ACTIVE')
  if(!activeLinks.length)return out

  const unitMap=new Map<string,Record<string,unknown>>()
  for(const row of unitMappings.data){
    if(String(row.status||'ACTIVE')!=='ACTIVE')continue
    if(row.sourceUnitId)unitMap.set(String(row.sourceUnitId),row)
    if(row.sourceUnitCallsign)unitMap.set(String(row.sourceUnitCallsign),row)
  }

  const personnelMap=new Map<string,Record<string,unknown>>()
  for(const row of personnelMappings.data){
    if(String(row.status||'ACTIVE')!=='ACTIVE')continue
    if(row.sourcePersonnelId)personnelMap.set(String(row.sourcePersonnelId),row)
  }

  for(const link of activeLinks){
    push(out,{fieldKey:'cad_source_incident_id',sectionKey:'DISPATCH',value:link.sourceIncidentId,prefillSource:'CAD',target:'CONTEXT',informational:true,label:'CAD Source Incident ID'})
    if(link.sourceIncidentNumber)push(out,{fieldKey:'cad_source_incident_number',sectionKey:'DISPATCH',value:link.sourceIncidentNumber,prefillSource:'CAD',target:'CONTEXT',informational:true,label:'CAD Source Incident Number'})

    const related=messages.data
      .filter(message=>message.cadConnectionId===link.cadConnectionId&&message.sourceIncidentId===link.sourceIncidentId)
      .sort((a,b)=>Date.parse(b.receivedAt)-Date.parse(a.receivedAt))
      .slice(0,20)

    for(const message of related){
      let detail
      try{detail=(await getCadMessageDetail(message.id)).data}catch{continue}

      for(const event of detail.normalizedEvents){
        const payload=(event.normalizedPayload||{}) as CadPayload
        const incident=payload.incident||{}
        const location=payload.location||{}
        const timestamps=payload.timestamps||{}
        const disposition=payload.disposition||{}
        const sourceMessageId=event.sourceMessageId||message.sourceMessageId
        const sourceEventId=event.sourceEventId

        push(out,{fieldKey:'dispatch_internal_id',sectionKey:'DISPATCH',value:event.sourceIncidentId||link.sourceIncidentId,prefillSource:'CAD',label:'CAD Dispatch / Incident ID',sourceMessageId,sourceEventId})
        push(out,{fieldKey:'dispatch_incident_code',sectionKey:'DISPATCH',value:incident.callType,prefillSource:'CAD',label:'CAD Incident Code',sourceMessageId,sourceEventId})
        push(out,{fieldKey:'cad_nature',sectionKey:'DISPATCH',value:incident.nature,prefillSource:'CAD',target:'CONTEXT',informational:true,label:'CAD Nature',sourceMessageId,sourceEventId})
        push(out,{fieldKey:'cad_priority',sectionKey:'DISPATCH',value:incident.priority,prefillSource:'CAD',target:'CONTEXT',informational:true,label:'CAD Priority',sourceMessageId,sourceEventId})

        push(out,{fieldKey:'dispatch_time_call_arrival',sectionKey:'DISPATCH',value:timestamps.callReceived,prefillSource:'CAD',label:'Call Received',sourceMessageId,sourceEventId})
        push(out,{fieldKey:'dispatch_time_call_create',sectionKey:'DISPATCH',value:timestamps.callEntered,prefillSource:'CAD',label:'Call Entered',sourceMessageId,sourceEventId})
        push(out,{fieldKey:'time_incident_clear',sectionKey:'DISPATCH',value:timestamps.closed,prefillSource:'CAD',label:'CAD Incident Closed',sourceMessageId,sourceEventId})
        push(out,{fieldKey:'dispatch_final_disposition',sectionKey:'DISPATCH',value:disposition.description||disposition.code,prefillSource:'CAD',label:'CAD Final Disposition',sourceMessageId,sourceEventId})

        const comments=(payload.comments||[]).filter(row=>!row.restricted).map(row=>text(row.text)).filter(Boolean)
        if(comments.length)push(out,{fieldKey:'dispatch_comment',sectionKey:'DISPATCH',value:comments,prefillSource:'CAD',label:'CAD Dispatch Comments',sourceMessageId,sourceEventId})
        const commentTimes=(payload.comments||[]).filter(row=>!row.restricted).map(row=>text(row.normalizedTimestamp||row.sourceTimestamp)).filter(Boolean)
        if(commentTimes.length)push(out,{fieldKey:'dispatch_comment_timestamp',sectionKey:'DISPATCH',value:commentTimes,prefillSource:'CAD',label:'CAD Comment Timestamps',sourceMessageId,sourceEventId})

        let addressNumber=text(location.addressNumber)
        let street=text(location.street)
        let streetType=''
        const fullAddress=text(location.fullAddress)
        if((!addressNumber||!street)&&fullAddress){
          const parsed=splitAddress(fullAddress)
          if(!addressNumber)addressNumber=parsed.number
          if(!street)street=parsed.street
          streetType=parsed.streetType
        }
        const numericAddress=Number(addressNumber)
        if(addressNumber&&Number.isInteger(numericAddress))push(out,{fieldKey:'an_number',sectionKey:'LOCATION',value:numericAddress,prefillSource:'CAD',label:'Address Number',sourceMessageId,sourceEventId})
        else if(addressNumber)push(out,{fieldKey:'an_complete',sectionKey:'LOCATION',value:addressNumber,prefillSource:'CAD',label:'Address Number',sourceMessageId,sourceEventId})
        push(out,{fieldKey:'sn_street_name',sectionKey:'LOCATION',value:street,prefillSource:'CAD',label:'Street Name',sourceMessageId,sourceEventId})
        push(out,{fieldKey:'sn_post_type',sectionKey:'LOCATION',value:streetType,prefillSource:'CAD',label:'Street Type',sourceMessageId,sourceEventId})
        push(out,{fieldKey:'nl_unit_value',sectionKey:'LOCATION',value:location.unit||location.apartment,prefillSource:'CAD',label:'Unit / Apartment',sourceMessageId,sourceEventId})
        push(out,{fieldKey:'nl_site',sectionKey:'LOCATION',value:location.locationName||location.commonName,prefillSource:'CAD',label:'Named Location',sourceMessageId,sourceEventId})
        push(out,{fieldKey:'csop_incorporated_muni',sectionKey:'LOCATION',value:location.city,prefillSource:'CAD',label:'Municipality',sourceMessageId,sourceEventId})
        push(out,{fieldKey:'csop_state',sectionKey:'LOCATION',value:location.state,prefillSource:'CAD',label:'State',sourceMessageId,sourceEventId})
        push(out,{fieldKey:'csop_postal_code',sectionKey:'LOCATION',value:location.postalCode,prefillSource:'CAD',label:'Postal Code',sourceMessageId,sourceEventId})
        push(out,{fieldKey:'csop_county',sectionKey:'LOCATION',value:location.county,prefillSource:'CAD',label:'County',sourceMessageId,sourceEventId})

        const district=location.responseZone||location.district||location.stationArea
        push(out,{fieldKey:'response_district',sectionKey:'OVERVIEW',value:district,prefillSource:'CAD',target:'INCIDENT',label:'Response District',sourceMessageId,sourceEventId})

        if(useful(location.latitude)&&useful(location.longitude)){
          push(out,{fieldKey:'cad_coordinates',sectionKey:'LOCATION',value:{latitude:Number(location.latitude),longitude:Number(location.longitude)},prefillSource:'CAD',target:'CONTEXT',informational:true,label:'CAD Coordinates',sourceMessageId,sourceEventId})
        }
        if(fullAddress)push(out,{fieldKey:'cad_full_address',sectionKey:'LOCATION',value:fullAddress,prefillSource:'CAD',target:'CONTEXT',informational:true,label:'CAD Full Address',sourceMessageId,sourceEventId})

        for(const unit of payload.units||[]){
          const sourceUnitId=text(unit.sourceUnitId)
          const sourceUnitCallsign=text(unit.sourceUnitCallsign)
          const mapping=unitMap.get(sourceUnitId)||unitMap.get(sourceUnitCallsign)
          const forgeUnitId=text(mapping?.forgeUnitId)
          if(!forgeUnitId){
            push(out,{fieldKey:`cad_unit:${sourceUnitId||sourceUnitCallsign}`,sectionKey:'UNITS_PERSONNEL',value:{sourceUnitId,sourceUnitCallsign,status:unit.status},prefillSource:'CAD',target:'CONTEXT',informational:true,label:`Unmapped CAD Unit ${sourceUnitCallsign||sourceUnitId}`,sourceMessageId,sourceEventId})
            continue
          }
          push(out,{
            fieldKey:`cad_unit_assignment:${forgeUnitId}`,
            sectionKey:'UNITS_PERSONNEL',
            value:{
              unitId:forgeUnitId,
              sourceUnitId,
              sourceUnitCallsign,
              unitRole:'RESPONSE',
              dispatchedAt:unit.dispatchedAt||timestamps.dispatch||null,
              enRouteAt:unit.enRouteAt||null,
              arrivedAt:unit.arrivedAt||null,
              clearedAt:unit.clearedAt||null
            },
            prefillSource:'CAD',
            target:'UNIT_ASSIGNMENT',
            label:`Assign CAD Unit ${sourceUnitCallsign||sourceUnitId}`,
            sourceMessageId,
            sourceEventId
          })
        }

        for(const person of payload.personnel||[]){
          const sourcePersonnelId=text(person.sourcePersonnelId)
          const mapping=personnelMap.get(sourcePersonnelId)
          const forgePersonnelId=text(mapping?.forgePersonnelId)
          if(!forgePersonnelId){
            push(out,{fieldKey:`cad_person:${sourcePersonnelId}`,sectionKey:'UNITS_PERSONNEL',value:{sourcePersonnelId,sourceName:person.sourceName,role:person.role},prefillSource:'CAD',target:'CONTEXT',informational:true,label:`Unmapped CAD Personnel ${text(person.sourceName)||sourcePersonnelId}`,sourceMessageId,sourceEventId})
            continue
          }
          push(out,{
            fieldKey:`cad_person_assignment:${forgePersonnelId}`,
            sectionKey:'UNITS_PERSONNEL',
            value:{
              personnelId:forgePersonnelId,
              role:text(person.role)||'RESPONDER'
            },
            prefillSource:'CAD',
            target:'PERSONNEL_ASSIGNMENT',
            label:`Assign CAD Personnel ${text(person.sourceName)||sourcePersonnelId}`,
            sourceMessageId,
            sourceEventId
          })
        }
      }
    }
  }

  const seen=new Set<string>()
  return out.filter(candidate=>{
    const key=`${candidate.target||'FIELD'}|${candidate.fieldKey}|${JSON.stringify(candidate.value)}`
    if(seen.has(key))return false
    seen.add(key)
    return true
  })
}

async function baseCandidates(
  incidentId:string,
  query:Query
):Promise<PrefillCandidate[]>{
  const incident=(await getIncident(incidentId)).data
  const [stations,personnel,occupancies,preplans]=await Promise.all([
    listRmsMasterData<MasterRow>('stations'),
    listRmsMasterData<MasterRow>('personnel'),
    listRmsMasterData<MasterRow>('occupancies'),
    listRmsMasterData<MasterRow>('preplans')
  ])
  const out:PrefillCandidate[]=[]
  const stationId=query.stationId||incident.stationId||''
  const personId=query.personnelId||incident.incidentCommanderPersonnelId||''
  const station=stations.data.find(row=>row.id===stationId)
  if(station){
    push(out,{fieldKey:'response_district',sectionKey:'OVERVIEW',value:station.defaultResponseDistrict,prefillSource:'TENANT_DEFAULT',target:'INCIDENT',label:'Response District'})
    push(out,{fieldKey:'station_timezone',sectionKey:'OVERVIEW',value:station.timezone,prefillSource:'TENANT_DEFAULT',target:'CONTEXT',informational:true,label:'Station Timezone'})
  }
  const person=personnel.data.find(row=>row.id===personId)
  if(person?.rank)push(out,{fieldKey:'personnel_rank',sectionKey:'UNITS_PERSONNEL',value:person.rank,prefillSource:'PERSONNEL',target:'CONTEXT',informational:true,label:'Personnel Rank'})

  if(query.occupancyId){
    const occupancy=occupancies.data.find(row=>row.id===query.occupancyId)
    if(occupancy){
      push(out,{fieldKey:'nl_site',sectionKey:'LOCATION',value:occupancy.name,prefillSource:'OCCUPANCY',label:'Site / Occupancy Name'})
      const address=String(occupancy.addressLine1||occupancy.address||'').trim()
      if(address){
        const parsed=splitAddress(address)
        const numericAddress=Number(parsed.number)
        if(parsed.number&&Number.isInteger(numericAddress))push(out,{fieldKey:'an_number',sectionKey:'LOCATION',value:numericAddress,prefillSource:'OCCUPANCY',label:'Address Number'})
        else push(out,{fieldKey:'an_complete',sectionKey:'LOCATION',value:parsed.number,prefillSource:'OCCUPANCY',label:'Address Number'})
        push(out,{fieldKey:'sn_street_name',sectionKey:'LOCATION',value:parsed.street,prefillSource:'OCCUPANCY',label:'Street Name'})
        push(out,{fieldKey:'sn_post_type',sectionKey:'LOCATION',value:parsed.streetType,prefillSource:'OCCUPANCY',label:'Street Type'})
      }
      push(out,{fieldKey:'csop_incorporated_muni',sectionKey:'LOCATION',value:occupancy.city,prefillSource:'OCCUPANCY',label:'Municipality'})
      push(out,{fieldKey:'csop_state',sectionKey:'LOCATION',value:occupancy.state,prefillSource:'OCCUPANCY',label:'State'})
      push(out,{fieldKey:'csop_postal_code',sectionKey:'LOCATION',value:occupancy.postalCode,prefillSource:'OCCUPANCY',label:'Postal Code'})
    }
  }

  if(query.preplanId){
    const preplan=preplans.data.find(row=>row.id===query.preplanId)
    if(preplan?.tacticalSummary)push(out,{fieldKey:'preplan_tactical_context',sectionKey:'LOCATION',value:preplan.tacticalSummary,prefillSource:'PREPLAN',target:'CONTEXT',informational:true,label:'Preplan Tactical Summary'})
  }
  return out
}

function normalizePlatformCandidate(candidate:PrefillCandidate):PrefillCandidate[]{
  const source=candidate.prefillSource
  const value=candidate.value
  if(candidate.fieldKey==='response_district'){
    return [{...candidate,fieldKey:'response_district',target:'INCIDENT',label:candidate.label||'Response District'}]
  }
  if(candidate.fieldKey==='station_timezone'){
    return [{...candidate,target:'CONTEXT',informational:true,label:candidate.label||'Station Timezone'}]
  }
  if(candidate.fieldKey==='personnel_rank'){
    return [{...candidate,target:'CONTEXT',informational:true,label:candidate.label||'Personnel Rank'}]
  }
  if(candidate.fieldKey==='location_name'){
    return [{...candidate,fieldKey:'nl_site',sectionKey:'LOCATION',target:'FIELD',label:candidate.label||'Site / Occupancy Name'}]
  }
  if(candidate.fieldKey==='address_line1'){
    const parsed=splitAddress(String(value||''))
    const out:PrefillCandidate[]=[]
    const numeric=Number(parsed.number)
    if(parsed.number){
      out.push({
        fieldKey:Number.isInteger(numeric)?'an_number':'an_complete',
        sectionKey:'LOCATION',
        value:Number.isInteger(numeric)?numeric:parsed.number,
        prefillSource:source,
        target:'FIELD',
        label:'Address Number'
      })
    }
    if(parsed.street)out.push({fieldKey:'sn_street_name',sectionKey:'LOCATION',value:parsed.street,prefillSource:source,target:'FIELD',label:'Street Name'})
    if(parsed.streetType)out.push({fieldKey:'sn_post_type',sectionKey:'LOCATION',value:parsed.streetType,prefillSource:source,target:'FIELD',label:'Street Type'})
    return out
  }
  if(candidate.fieldKey==='tactical_summary'){
    return [{...candidate,fieldKey:'preplan_tactical_context',target:'CONTEXT',informational:true,label:candidate.label||'Preplan Tactical Summary'}]
  }
  return [{...candidate,target:candidate.target||'FIELD'}]
}

export async function getIncidentPrefill(
  incidentId:string,
  query:Query={}
):Promise<ForgePlatformResult<PrefillCandidate[]>>{
  const mode=getForgePlatformMode()
  let source:'platform'|'demo'='demo'
  let result:PrefillCandidate[]=[]

  if(mode!=='demo'){
    try{
      const platform=await forgePlatformGet<PrefillCandidate[]>(base(incidentId),query as Record<string,string>)
      result=platform.data.flatMap(normalizePlatformCandidate)
      source='platform'
    }catch(error){
      if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error
      result=await baseCandidates(incidentId,query)
    }
  }else{
    result=await baseCandidates(incidentId,query)
  }

  try{result.push(...await cadCandidates(incidentId))}catch{}
  return {data:result.filter(candidate=>useful(candidate.value)),source}
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
  const units:PrefillCandidate[]=[]
  const personnel:PrefillCandidate[]=[]

  for(const candidate of candidates){
    const target=candidate.target||'FIELD'
    if(candidate.informational||target==='CONTEXT'){skipped+=1;continue}
    if(target==='INCIDENT'){
      if(candidate.fieldKey==='response_district'){
        if(!incident.responseDistrict){header.responseDistrict=candidate.value;applied+=1}else skipped+=1
      }else if(candidate.fieldKey==='primary_incident_type'){
        if(!incident.primaryIncidentTypeCode){header.primaryIncidentTypeCode=candidate.value;applied+=1}else skipped+=1
      }else skipped+=1
      continue
    }
    if(target==='UNIT_ASSIGNMENT'){units.push(candidate);continue}
    if(target==='PERSONNEL_ASSIGNMENT'){personnel.push(candidate);continue}
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

      let fieldState:NerisFieldValueState
      if(field.valueSetLocation){
        const options=(await lookupValueSetOptions(field.valueSetLocation,String(candidate.value||''))).data
        const wanted=String(candidate.value||'').trim().toLowerCase()
        const match=options.find(option=>
          option.id.toLowerCase()===wanted ||
          option.label.trim().toLowerCase()===wanted ||
          String(option.subtitle||'').trim().toLowerCase()===wanted
        )
        if(!match){skipped+=1;continue}
        fieldState={valueOptionId:match.id}
      }else{
        fieldState=stateFor(candidate.value)
      }

      values.push({
        fieldId:field.fieldId,
        fieldKey:field.fieldKey,
        sectionKey:candidate.sectionKey||descriptor.modules.find(module=>module.fields.some(f=>f.fieldId===field.fieldId))?.sectionKey||'OVERVIEW',
        ...fieldState,
        prefillSource:candidate.prefillSource,
        userConfirmed:false
      })
    }
    if(values.length){
      const result=await batchFieldValues(incidentId,values,incident.recordVersion)
      incident=result.data.incident
      applied+=result.data.upserted
      skipped+=Math.max(0,values.length-result.data.upserted)
    }
  }

  if(units.length){
    const existing=(await listIncidentUnits(incidentId)).data
    const existingIds=new Set(existing.map(row=>String(row.unitId||'')))
    for(const candidate of units){
      const value=(candidate.value||{}) as Record<string,unknown>
      const unitId=text(value.unitId)
      if(!unitId||existingIds.has(unitId)){skipped+=1;continue}
      const payload:Record<string,unknown>={
        unitId,
        isPrimary:existingIds.size===0,
        unitRole:text(value.unitRole)||'RESPONSE'
      }
      for(const key of ['dispatchedAt','enRouteAt','arrivedAt','clearedAt']){
        if(useful(value[key]))payload[key]=value[key]
      }
      try{
        await addIncidentUnit(incidentId,payload)
        existingIds.add(unitId)
        applied+=1
      }catch{skipped+=1}
    }
  }

  if(personnel.length){
    const existing=(await listIncidentPersonnel(incidentId)).data
    const existingIds=new Set(existing.map(row=>String(row.personnelId||'')))
    for(const candidate of personnel){
      const value=(candidate.value||{}) as Record<string,unknown>
      const personnelId=text(value.personnelId)
      if(!personnelId||existingIds.has(personnelId)){skipped+=1;continue}
      try{
        await addIncidentPersonnel(incidentId,{
          personnelId,
          role:text(value.role)||'RESPONDER'
        })
        existingIds.add(personnelId)
        applied+=1
      }catch{skipped+=1}
    }
  }

  return {data:{incident,applied,skipped},source:incidentResult.source}
}
