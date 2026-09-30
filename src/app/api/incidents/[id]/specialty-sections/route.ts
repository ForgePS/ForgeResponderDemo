import { NextResponse } from 'next/server'
import { updateSpecialtySection } from '@/lib/forge-platform/neris'

export async function POST(request:Request,context:{params:Promise<{id:string}>}){
  try{const {id}=await context.params;const body=await request.json();return NextResponse.json(await updateSpecialtySection(id,String(body.sectionKey||''),body.action))}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to update specialty section.'},{status:400})}
}
