import { NextResponse } from 'next/server'
import { setCadSimulatorOutage } from '@/lib/forge-platform/cad'
export async function POST(request:Request){try{const body=await request.json();return NextResponse.json(await setCadSimulatorOutage(String(body.connectionId||''),String(body.reason||''),Boolean(body.recover)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to update CAD simulator outage.'},{status:400})}}
