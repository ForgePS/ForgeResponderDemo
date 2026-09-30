import { NextResponse } from 'next/server'
import { createCadConnection, listCadConnections, patchCadConnection } from '@/lib/forge-platform/cad'
export async function GET(){try{return NextResponse.json(await listCadConnections())}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load CAD connections.'},{status:400})}}
export async function POST(request:Request){try{return NextResponse.json(await createCadConnection(await request.json()),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to create CAD connection.'},{status:400})}}


export async function PATCH(request:Request){
  try{
    const body=await request.json()
    const id=String(body.id||'')
    const recordVersion=Number(body.recordVersion||1)
    if(!id)throw new Error('CAD connection id is required.')
    const {id:_id,recordVersion:_recordVersion,...payload}=body
    return NextResponse.json(await patchCadConnection(id,payload,recordVersion))
  }catch(error){
    const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400
    return NextResponse.json({error:error instanceof Error?error.message:'Unable to update CAD connection.'},{status})
  }
}
