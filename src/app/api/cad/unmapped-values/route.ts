import { NextResponse } from 'next/server'
import { listCadUnmappedValues } from '@/lib/forge-platform/cad'
export async function GET(){try{return NextResponse.json(await listCadUnmappedValues())}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load unmapped CAD values.'},{status:400})}}
