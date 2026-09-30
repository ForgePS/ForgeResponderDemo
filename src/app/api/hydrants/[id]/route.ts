import { NextResponse } from 'next/server'
import { readForgeData, writeForgeData } from '@/utils/forgeDataStore'

function version(request: Request): number {
  const raw=request.headers.get('x-record-version')||request.headers.get('if-match')||'1'
  const match=raw.match(/(\d+)/)
  return match?Number(match[1]):1
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id }=await context.params
    const payload=await request.json() as Record<string, unknown>
    const rows=readForgeData<Record<string, unknown>[]>('hydrants')
    const index=rows.findIndex(row=>row.id===id)
    if(index<0) return NextResponse.json({error:'Hydrant not found.'},{status:404})
    const current=rows[index]
    const currentVersion=Number(current.recordVersion||1)
    if(currentVersion!==version(request)) return NextResponse.json({error:'Hydrant was modified elsewhere.'},{status:412})
    const updated={...current,...payload,id,recordVersion:currentVersion+1,updatedAt:new Date().toISOString()}
    rows[index]=updated;writeForgeData('hydrants',rows)
    return NextResponse.json({data:updated,source:'demo'})
  } catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:'Unable to update hydrant.'},{status:400})
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id }=await context.params
  const rows=readForgeData<Record<string, unknown>[]>('hydrants')
  const index=rows.findIndex(row=>row.id===id)
  if(index<0) return NextResponse.json({error:'Hydrant not found.'},{status:404})
  const current=rows[index]
  const currentVersion=Number(current.recordVersion||1)
  if(currentVersion!==version(request)) return NextResponse.json({error:'Hydrant was modified elsewhere.'},{status:412})
  rows.splice(index,1);writeForgeData('hydrants',rows)
  return NextResponse.json({data:{id,deleted:true},source:'demo'})
}
