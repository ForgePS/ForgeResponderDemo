import { NextResponse } from 'next/server'
import { archiveSpecialtyRecord, type SpecialtyKind } from '@/lib/forge-platform/specialty'

const allowed=new Set<SpecialtyKind>([
  'exposures','civilian-casualties','fire-service-casualties',
  'hazmat-substances','hazmat-containers','alarm-systems','protection-systems','attachments'
])

export async function POST(_request:Request,context:{params:Promise<{id:string;kind:string;recordId:string}>}){
  try{
    const {id,kind,recordId}=await context.params
    if(!allowed.has(kind as SpecialtyKind))throw new Error('Unsupported specialty record type.')
    return NextResponse.json(await archiveSpecialtyRecord(kind as SpecialtyKind,id,recordId))
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to archive specialty record.'},{status:400})}
}
