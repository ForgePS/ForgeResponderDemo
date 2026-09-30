import { NextResponse } from 'next/server'
import { approveIncident } from '@/lib/forge-platform/incidents'
export async function POST(_request:Request,context:{params:Promise<{id:string}>}){try{const {id}=await context.params;return NextResponse.json(await approveIncident(id))}catch(error){const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400;return NextResponse.json({error:error instanceof Error?error.message:'Unable to approve incident.'},{status})}}
