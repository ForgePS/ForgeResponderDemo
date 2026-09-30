import { NextResponse } from 'next/server'
import { getIncidentIntelligence } from '@/lib/forge-platform/incident-intelligence'

export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
  try{
    const {id}=await context.params
    return NextResponse.json(await getIncidentIntelligence(id))
  }catch(error){
    const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400
    return NextResponse.json({error:error instanceof Error?error.message:'Unable to load incident intelligence.'},{status})
  }
}
