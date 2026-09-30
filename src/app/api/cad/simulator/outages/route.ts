import { NextResponse } from 'next/server'
import { listCadSimulatorOutages } from '@/lib/forge-platform/cad'
export async function GET(){try{return NextResponse.json(await listCadSimulatorOutages())}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load CAD outage history.'},{status:400})}}
