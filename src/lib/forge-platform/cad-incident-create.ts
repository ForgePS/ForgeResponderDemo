import 'server-only'

import { createIncident } from '@/lib/forge-platform/incidents'
import { linkCadIncident, listCadMessages } from '@/lib/forge-platform/cad'
import type { ForgePlatformResult } from '@/lib/forge-platform/server'

export async function createIncidentFromCadMessage(rawMessageId:string):Promise<ForgePlatformResult<{incidentId:string;incidentNumber:string;sourceIncidentId:string}>>{
  const messages=await listCadMessages()
  const message=messages.data.find(row=>row.id===rawMessageId)
  if(!message)throw new Error('CAD message not found.')
  if(!message.sourceIncidentId)throw new Error('CAD message does not include a source incident id.')

  const incident=await createIncident({
    incidentDate:message.receivedAt.slice(0,10),
    incidentSource:'CAD',
    dispatchDescription:`Created from CAD source incident ${message.sourceIncidentId}`
  })

  await linkCadIncident(incident.data.id,{
    cadConnectionId:message.cadConnectionId,
    sourceIncidentId:message.sourceIncidentId,
    reason:'Forge incident created from CAD message'
  })

  return {
    data:{
      incidentId:incident.data.id,
      incidentNumber:incident.data.incidentNumber,
      sourceIncidentId:message.sourceIncidentId
    },
    source:incident.source
  }
}
