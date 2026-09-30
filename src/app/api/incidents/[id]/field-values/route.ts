import { NextResponse } from 'next/server'
import { batchFieldValues, listFieldValues } from '@/lib/forge-platform/neris'

function version(request:Request){const raw=request.headers.get('x-record-version')||request.headers.get('if-match');const match=raw?.match(/(\d+)/);if(!match)throw new Error('Record version is required.');return Number(match[1])}

export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
  try{const {id}=await context.params;return NextResponse.json(await listFieldValues(id))}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load NERIS field values.'},{status:400})}
}

export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){
  try{const {id}=await context.params;const body=await request.json();return NextResponse.json(await batchFieldValues(id,Array.isArray(body.values)?body.values:[],version(request)))}
  catch(error){const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400;return NextResponse.json({error:error instanceof Error?error.message:'Unable to save NERIS field values.'},{status})}
}
