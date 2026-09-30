import { NextResponse } from 'next/server'
import { acceptAiNarrative } from '@/lib/forge-platform/ai-narrative'

export async function POST(request:Request,context:{params:Promise<{id:string}>}){
  try{
    const {id}=await context.params
    const body=await request.json()
    return NextResponse.json(await acceptAiNarrative(id,String(body.requestId||''),String(body.draftId||''),String(body.draftText||''),Number(body.recordVersion||1)))
  }catch(error){
    const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400
    return NextResponse.json({error:error instanceof Error?error.message:'Unable to accept narrative draft.'},{status})
  }
}
