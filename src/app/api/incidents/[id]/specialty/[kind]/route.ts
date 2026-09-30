import { NextResponse } from 'next/server'
import { createSpecialtyRecord, listSpecialtyRecords, patchSpecialtyRecord, type SpecialtyKind } from '@/lib/forge-platform/specialty'

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


function version(request:Request){
  const raw=request.headers.get('x-record-version')||request.headers.get('if-match')
  const match=raw?.match(/(\d+)/)
  if(!match)throw new Error('Record version is required.')
  return Number(match[1])
}

export async function PATCH(request:Request,context:{params:Promise<{id:string;kind:string}>}){
  try{
    const {id,kind}=await context.params
    const body=await request.json()
    const recordId=String(body.id||'')
    if(!recordId)throw new Error('Specialty record id is required.')
    const {id:_id,...payload}=body
    return NextResponse.json(await patchSpecialtyRecord(kindOf(kind),id,recordId,payload,version(request)))
  }catch(error){
    const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400
    return NextResponse.json({error:error instanceof Error?error.message:'Unable to update specialty record.'},{status})
  }
}
