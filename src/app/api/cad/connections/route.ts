import { NextResponse } from 'next/server'
import { createCadConnection, listCadConnections } from '@/lib/forge-platform/cad'
export async function GET(){try{return NextResponse.json(await listCadConnections())}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load CAD connections.'},{status:400})}}
export async function POST(request:Request){try{return NextResponse.json(await createCadConnection(await request.json()),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to create CAD connection.'},{status:400})}}
