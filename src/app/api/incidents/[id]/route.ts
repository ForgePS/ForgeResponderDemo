import { NextResponse } from 'next/server'
import { getIncident, patchIncident } from '@/lib/forge-platform/incidents'

function readVersion(request:Request){const raw=request.headers.get('x-record-version')||request.headers.get('if-match');const match=raw?.match(/(\d+)/);if(!match)throw new Error('Record version is required.');return Number(match[1])}

export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
  try{const {id}=await context.params;return NextResponse.json(await getIncident(id))}
  catch(error){const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400;return NextResponse.json({error:error instanceof Error?error.message:'Unable to load incident.'},{status})}
}

export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){
  try{const {id}=await context.params;return NextResponse.json(await patchIncident(id,await request.json(),readVersion(request)))}
  catch(error){const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400;return NextResponse.json({error:error instanceof Error?error.message:'Unable to update incident.'},{status})}
}
