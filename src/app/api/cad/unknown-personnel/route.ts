import { NextResponse } from 'next/server'
import { listCadUnknownPersonnel } from '@/lib/forge-platform/cad'
export async function GET(){try{return NextResponse.json(await listCadUnknownPersonnel())}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load unknown CAD personnel.'},{status:400})}}
