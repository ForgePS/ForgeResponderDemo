import { NextResponse } from 'next/server'
import { listCadUnitMappings } from '@/lib/forge-platform/cad'
export async function GET(){try{return NextResponse.json(await listCadUnitMappings())}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load CAD unit mappings.'},{status:400})}}
