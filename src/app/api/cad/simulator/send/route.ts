import { NextResponse } from 'next/server'
import { sendCadSimulatorScenario } from '@/lib/forge-platform/cad'
import { createIncidentFromCadMessage } from '@/lib/forge-platform/cad-incident-create'
import { getIncident } from '@/lib/forge-platform/incidents'
import { applyIncidentPrefill, getIncidentPrefill } from '@/lib/forge-platform/prefill'

export async function POST(request:Request){
  try{
    const body=await request.json()
    const sent=await sendCadSimulatorScenario(body)
    if(sent.source==='demo'&&body.autoDispatch===true){
      const rawMessageId=String(sent.data.rawMessageId||'')
      if(rawMessageId){
        const created=await createIncidentFromCadMessage(rawMessageId)
        const incident=await getIncident(created.data.incidentId)
        const suggestions=await getIncidentPrefill(created.data.incidentId)
        const selected=suggestions.data.filter(candidate=>!candidate.informational&&(candidate.target||'FIELD')!=='CONTEXT')
        const prefill=selected.length
          ? await applyIncidentPrefill(created.data.incidentId,selected,incident.data.recordVersion)
          : {data:{incident:incident.data,applied:0,skipped:0},source:incident.source}
        return NextResponse.json({
          ...sent,
          data:{
            ...sent.data,
            incident:created.data,
            autoPrefill:{
              applied:prefill.data.applied,
              skipped:prefill.data.skipped,
              reviewRequired:true
            }
          }
        })
      }
    }
    return NextResponse.json(sent)
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:'Unable to send CAD simulator scenario.'},{status:400})
  }
}
