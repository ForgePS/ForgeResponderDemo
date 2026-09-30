import { NextResponse } from 'next/server'
import { listCadUnknownUnits } from '@/lib/forge-platform/cad'
export async function GET(){try{return NextResponse.json(await listCadUnknownUnits())}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load unknown CAD units.'},{status:400})}}
