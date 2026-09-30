import { NextResponse } from 'next/server'
import { addIncidentPersonnel, listIncidentPersonnel } from '@/lib/forge-platform/incidents'
export async function GET(_request:Request,context:{params:Promise<{id:string}>}){try{const {id}=await context.params;return NextResponse.json(await listIncidentPersonnel(id))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load personnel.'},{status:400})}}
export async function POST(request:Request,context:{params:Promise<{id:string}>}){try{const {id}=await context.params;return NextResponse.json(await addIncidentPersonnel(id,await request.json()),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to assign personnel.'},{status:400})}}
