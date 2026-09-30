import { NextResponse } from 'next/server'
import { resolveCadUnknownPersonnel } from '@/lib/forge-platform/cad'
export async function POST(request:Request,context:{params:Promise<{id:string}>}){try{const {id}=await context.params;return NextResponse.json(await resolveCadUnknownPersonnel(id,await request.json()))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to resolve unknown CAD personnel.'},{status:400})}}
