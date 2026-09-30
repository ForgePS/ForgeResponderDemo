import { NextResponse } from 'next/server'
import { createAiNarrative, type AiNarrativeRequestType } from '@/lib/forge-platform/ai-narrative'

export async function POST(request:Request,context:{params:Promise<{id:string}>}){
  try{
    const {id}=await context.params
    const body=await request.json()
    return NextResponse.json(await createAiNarrative(id,body.requestType as AiNarrativeRequestType,body.existingNarrative?String(body.existingNarrative):null),{status:201})
  }catch(error){
    const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400
    return NextResponse.json({error:error instanceof Error?error.message:'Unable to generate narrative draft.'},{status})
  }
}
