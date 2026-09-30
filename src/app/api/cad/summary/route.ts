import { NextResponse } from 'next/server'
import { getCadOperationsSummary } from '@/lib/forge-platform/cad'
export async function GET(){try{return NextResponse.json(await getCadOperationsSummary())}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load CAD summary.'},{status:400})}}
