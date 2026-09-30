import { NextResponse } from 'next/server'
import { listCadPersonnelMappings } from '@/lib/forge-platform/cad'
export async function GET(){try{return NextResponse.json(await listCadPersonnelMappings())}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load CAD personnel mappings.'},{status:400})}}
