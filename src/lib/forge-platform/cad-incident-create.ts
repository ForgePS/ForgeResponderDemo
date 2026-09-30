import 'server-only'

import { createIncident, listIncidents } from '@/lib/forge-platform/incidents'
import { getCadIncidentStatus, linkCadIncident, listCadMessages } from '@/lib/forge-platform/cad'
import type { ForgePlatformResult } from '@/lib/forge-platform/server'

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
    incidentSource:'CAD',
    dispatchDescription:`Created from CAD source incident ${message.sourceIncidentId}`
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
