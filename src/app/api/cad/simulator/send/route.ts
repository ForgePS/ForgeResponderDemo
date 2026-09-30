import { NextResponse } from 'next/server'
import { sendCadSimulatorScenario } from '@/lib/forge-platform/cad'
import { createIncidentFromCadMessage } from '@/lib/forge-platform/cad-incident-create'

export async function POST(request:Request){
  try{
    const body=await request.json()
    const sent=await sendCadSimulatorScenario(body)
    if(sent.source==='demo'&&body.autoDispatch===true){
      const rawMessageId=String(sent.data.rawMessageId||'')
      if(rawMessageId){
        const created=await createIncidentFromCadMessage(rawMessageId)
        return NextResponse.json({...sent,data:{...sent.data,incident:created.data}})
      }
    }
    return NextResponse.json(sent)
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:'Unable to send CAD simulator scenario.'},{status:400})
  }
}
