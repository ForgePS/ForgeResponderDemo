import { NextResponse } from 'next/server'
import { listStatusHistory } from '@/lib/forge-platform/incidents'

export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
  try{const {id}=await context.params;return NextResponse.json(await listStatusHistory(id))}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load status history.'},{status:400})}
}
