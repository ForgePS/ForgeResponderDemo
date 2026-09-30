import { NextResponse } from 'next/server'
import { getFormDescriptor } from '@/lib/forge-platform/neris'

export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
  try{const {id}=await context.params;return NextResponse.json(await getFormDescriptor(id))}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load NERIS form descriptor.'},{status:400})}
}
