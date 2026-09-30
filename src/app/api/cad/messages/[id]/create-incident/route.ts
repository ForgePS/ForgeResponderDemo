import { NextResponse } from 'next/server'
import { createIncidentFromCadMessage } from '@/lib/forge-platform/cad-incident-create'

export async function POST(_request:Request,context:{params:Promise<{id:string}>}){
  try{
    const {id}=await context.params
    return NextResponse.json(await createIncidentFromCadMessage(id),{status:201})
  }catch(error){
    const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400
    return NextResponse.json({error:error instanceof Error?error.message:'Unable to create incident from CAD message.'},{status})
  }
}
