import { NextResponse } from 'next/server'
import { quarantineCadMessage } from '@/lib/forge-platform/cad'
export async function POST(request:Request,context:{params:Promise<{id:string}>}){try{const {id}=await context.params;const body=await request.json();return NextResponse.json(await quarantineCadMessage(id,String(body.reason||'')))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to quarantine CAD message.'},{status:400})}}
