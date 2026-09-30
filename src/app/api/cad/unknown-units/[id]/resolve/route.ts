import { NextResponse } from 'next/server'
import { resolveCadUnknownUnit } from '@/lib/forge-platform/cad'
export async function POST(request:Request,context:{params:Promise<{id:string}>}){try{const {id}=await context.params;return NextResponse.json(await resolveCadUnknownUnit(id,await request.json()))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to resolve unknown CAD unit.'},{status:400})}}
