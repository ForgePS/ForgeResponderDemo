import 'server-only'

import { addIncidentPersonnel, addIncidentUnit, createIncident, getIncident, listIncidents } from '@/lib/forge-platform/incidents'
import { getCadIncidentStatus, linkCadIncident, listCadMessages, markDemoCadMessageApplied } from '@/lib/forge-platform/cad'
import { batchFieldValues, getFormDescriptor } from '@/lib/forge-platform/neris'
import { listRmsMasterData } from '@/lib/forge-platform/rms'
import { getForgePlatformMode, type ForgePlatformResult } from '@/lib/forge-platform/server'

export async function createIncidentFromCadMessage(rawMessageId:string):Promise<ForgePlatformResult<{incidentId:string;incidentNumber:string;sourceIncidentId:string;existing:boolean;linkWarning?:string}>>{
  const messages=await listCadMessages()
  const message=messages.data.find(row=>row.id===rawMessageId)
  if(!message)throw new Error('CAD message not found.')
  if(!message.sourceIncidentId)throw new Error('CAD message does not include a source incident id.')

  const incidents=await listIncidents()
  const statusRows=await Promise.all(incidents.data.map(async incident=>{
    try{return {incident,status:(await getCadIncidentStatus(incident.id)).data}}catch{return {incident,status:null}}
  }))
  const existing=statusRows.find(row=>row.status?.links.some(link=>link.cadConnectionId===message.cadConnectionId&&link.sourceIncidentId===message.sourceIncidentId))
  if(existing){
    return {
      data:{
        incidentId:existing.incident.id,
        incidentNumber:existing.incident.incidentNumber,
        sourceIncidentId:message.sourceIncidentId,
        existing:true
      },
      source:incidents.source
    }
  }

  const incident=await createIncident({
    incidentDate:message.receivedAt.slice(0,10),
    alarmAt:message.simulatedDispatchAt||message.receivedAt,
    incidentSource:'CAD',
    dispatchDescription:message.simulatedDescription||`Created from CAD source incident ${message.sourceIncidentId}`,
    primaryIncidentTypeCode:message.simulatedCallType||undefined
  })

  let linkWarning:string|undefined
  try{
    await linkCadIncident(incident.data.id,{
      cadConnectionId:message.cadConnectionId,
      sourceIncidentId:message.sourceIncidentId,
      reason:'Forge incident created from CAD message'
    })
  }catch(error){
    linkWarning=error instanceof Error?error.message:'Incident was created, but CAD linkage failed.'
  }

  if(getForgePlatformMode()==='demo'||incident.source==='demo'){
    const [units,personnel]=await Promise.all([
      listRmsMasterData<Record<string,unknown>&{id:string}>('units'),
      listRmsMasterData<Record<string,unknown>&{id:string}>('personnel')
    ])
    const unitCallsigns=new Set(message.simulatedUnitCallsigns||[])
    const matchingUnits=units.data.filter(row=>unitCallsigns.has(String(row.callSign||row.unitNumber||'')))
    for(const [index,unit] of matchingUnits.entries()){
      await addIncidentUnit(incident.data.id,{
        unitId:unit.id,
        isPrimary:index===0,
        unitRole:index===0?'PRIMARY_RESPONSE':'CAD_RESPONSE',
        ...(message.simulatedDispatchAt?{dispatchedAt:message.simulatedDispatchAt}:{})
      })
    }

    const personnelIds=new Set(message.simulatedPersonnelIds||[])
    const matchingPersonnel=personnel.data.filter(row=>personnelIds.has(String(row.id)))
    for(const person of matchingPersonnel){
      await addIncidentPersonnel(incident.data.id,{
        personnelId:person.id,
        role:'RESPONDER',
        ...(person.rank?{rank:person.rank}:{})
      })
    }

    const descriptor=(await getFormDescriptor(incident.data.id)).data
    const fieldByKey=new Map(descriptor.modules.flatMap(module=>module.fields).map(field=>[field.fieldKey,field]))
    const candidates:Array<{fieldKey:string;sectionKey:string;valueText?:string;valueTimestamp?:string;valueJson?:unknown}>=[
      {fieldKey:'dispatch_internal_id',sectionKey:'DISPATCH',valueText:message.sourceIncidentId},
      ...(message.simulatedCallType?[{fieldKey:'dispatch_incident_code',sectionKey:'DISPATCH',valueText:message.simulatedCallType}]:[]),
      ...(message.receivedAt?[{fieldKey:'dispatch_time_call_arrival',sectionKey:'DISPATCH',valueTimestamp:message.receivedAt}]:[]),
      ...(message.simulatedDispatchAt?[{fieldKey:'dispatch_time_call_create',sectionKey:'DISPATCH',valueTimestamp:message.simulatedDispatchAt}]:[]),
      ...(message.simulatedComments?.length?[{fieldKey:'dispatch_comment',sectionKey:'DISPATCH',valueJson:message.simulatedComments}]:[])
    ]
    const values=candidates.flatMap(candidate=>{
      const field=fieldByKey.get(candidate.fieldKey)
      if(!field)return []
      return [{
        fieldId:field.fieldId,
        fieldKey:field.fieldKey,
        sectionKey:candidate.sectionKey,
        valueText:candidate.valueText??null,
        valueTimestamp:candidate.valueTimestamp??null,
        valueJson:candidate.valueJson??null,
        prefillSource:'CAD' as const,
        userConfirmed:false
      }]
    })
    if(values.length){
      const latest=(await getIncident(incident.data.id)).data
      await batchFieldValues(incident.data.id,values,latest.recordVersion)
    }
    markDemoCadMessageApplied(rawMessageId,incident.data.id)
  }

  return {
    data:{
      incidentId:incident.data.id,
      incidentNumber:incident.data.incidentNumber,
      sourceIncidentId:message.sourceIncidentId,
      existing:false,
      ...(linkWarning?{linkWarning}:{})
    },
    source:incident.source
  }
}
