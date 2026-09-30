import { NextResponse } from 'next/server'
import { replayCadMessages } from '@/lib/forge-platform/cad'
export async function POST(request:Request){try{const body=await request.json();return NextResponse.json(await replayCadMessages(Array.isArray(body.rawMessageIds)?body.rawMessageIds.map(String):[],String(body.reason||'')))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to replay CAD messages.'},{status:400})}}
