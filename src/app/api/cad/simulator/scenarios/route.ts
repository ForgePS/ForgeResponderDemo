import { NextResponse } from 'next/server'
import { listCadSimulatorScenarios } from '@/lib/forge-platform/cad'
export async function GET(){try{return NextResponse.json(await listCadSimulatorScenarios())}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load CAD simulator scenarios.'},{status:400})}}
