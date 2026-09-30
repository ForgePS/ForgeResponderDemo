import { NextResponse } from 'next/server'
import { listCadMessages } from '@/lib/forge-platform/cad'
export async function GET(){try{return NextResponse.json(await listCadMessages())}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load CAD messages.'},{status:400})}}
