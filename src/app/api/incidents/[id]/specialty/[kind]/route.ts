import { NextResponse } from 'next/server'
import { createSpecialtyRecord, listSpecialtyRecords, type SpecialtyKind } from '@/lib/forge-platform/specialty'

const allowed=new Set<SpecialtyKind>([
  'exposures','civilian-casualties','fire-service-casualties',
  'hazmat-substances','hazmat-containers','alarm-systems','protection-systems','attachments'
])

function kindOf(raw:string):SpecialtyKind{
  if(!allowed.has(raw as SpecialtyKind))throw new Error('Unsupported specialty record type.')
  return raw as SpecialtyKind
}

export async function GET(_request:Request,context:{params:Promise<{id:string;kind:string}>}){
  try{const {id,kind}=await context.params;return NextResponse.json(await listSpecialtyRecords(kindOf(kind),id))}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load specialty records.'},{status:400})}
}

export async function POST(request:Request,context:{params:Promise<{id:string;kind:string}>}){
  try{const {id,kind}=await context.params;return NextResponse.json(await createSpecialtyRecord(kindOf(kind),id,await request.json()),{status:201})}
  catch(error){const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400;return NextResponse.json({error:error instanceof Error?error.message:'Unable to create specialty record.'},{status})}
}
