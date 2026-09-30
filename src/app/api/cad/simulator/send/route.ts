import { NextResponse } from 'next/server'
import { sendCadSimulatorScenario } from '@/lib/forge-platform/cad'
export async function POST(request:Request){try{return NextResponse.json(await sendCadSimulatorScenario(await request.json()))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to send CAD simulator scenario.'},{status:400})}}
