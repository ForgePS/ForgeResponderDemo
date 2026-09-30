import { NextResponse } from 'next/server'
import { createHydrant, listHydrants } from '@/lib/forge-platform/hydrants'

export async function GET(){
  try{return NextResponse.json(await listHydrants())}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load hydrants.'},{status:400})}
}
export async function POST(request:Request){
  try{return NextResponse.json(await createHydrant(await request.json()),{status:201})}
  catch(error){const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400;return NextResponse.json({error:error instanceof Error?error.message:'Unable to create hydrant.'},{status})}
}
