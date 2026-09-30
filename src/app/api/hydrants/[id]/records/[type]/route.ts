import { NextResponse } from 'next/server'
import { createHydrantRecord, type HydrantRecordType } from '@/lib/forge-platform/hydrants'

function asType(value:string):HydrantRecordType{if(value==='flow-tests'||value==='inspections'||value==='damage')return value;throw new Error(`Unsupported hydrant record type: ${value}`)}

export async function POST(request:Request,context:{params:Promise<{id:string;type:string}>}){
  try{const {id,type:rawType}=await context.params;return NextResponse.json(await createHydrantRecord(id,asType(rawType),await request.json()),{status:201})}
  catch(error){const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400;return NextResponse.json({error:error instanceof Error?error.message:'Unable to save hydrant record.'},{status})}
}
