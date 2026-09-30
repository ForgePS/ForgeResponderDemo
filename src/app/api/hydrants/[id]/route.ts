import { NextResponse } from 'next/server'
import { deleteHydrant, updateHydrant } from '@/lib/forge-platform/hydrants'

function version(request:Request){const raw=request.headers.get('x-record-version')||request.headers.get('if-match')||'1';const match=raw.match(/(\d+)/);return match?Number(match[1]):1}

export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){
  try{const {id}=await context.params;return NextResponse.json(await updateHydrant(id,await request.json(),version(request)))}
  catch(error){const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400;return NextResponse.json({error:error instanceof Error?error.message:'Unable to update hydrant.'},{status})}
}
export async function DELETE(request:Request,context:{params:Promise<{id:string}>}){
  try{const {id}=await context.params;return NextResponse.json(await deleteHydrant(id,version(request)))}
  catch(error){const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400;return NextResponse.json({error:error instanceof Error?error.message:'Unable to delete hydrant.'},{status})}
}
