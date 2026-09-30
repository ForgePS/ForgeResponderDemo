import { NextResponse } from 'next/server'
import { applyIncidentPrefill, getIncidentPrefill, type PrefillCandidate } from '@/lib/forge-platform/prefill'

export async function GET(request:Request,context:{params:Promise<{id:string}>}){
  try{
    const {id}=await context.params
    const url=new URL(request.url)
    const query:Record<string,string>={}
    for(const key of ['stationId','personnelId','occupancyId','preplanId']){
      const value=url.searchParams.get(key)
      if(value)query[key]=value
    }
    return NextResponse.json(await getIncidentPrefill(id,query))
  }catch(error){
    const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400
    return NextResponse.json({error:error instanceof Error?error.message:'Unable to load incident prefill.'},{status})
  }
}

export async function POST(request:Request,context:{params:Promise<{id:string}>}){
  try{
    const {id}=await context.params
    const body=await request.json()
    const candidates=Array.isArray(body.candidates)?body.candidates as PrefillCandidate[]:[]
    return NextResponse.json(await applyIncidentPrefill(id,candidates,Number(body.recordVersion||1)))
  }catch(error){
    const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400
    return NextResponse.json({error:error instanceof Error?error.message:'Unable to apply incident prefill.'},{status})
  }
}
