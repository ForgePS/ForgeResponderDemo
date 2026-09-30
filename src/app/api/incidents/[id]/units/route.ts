import { NextResponse } from 'next/server'
import { addIncidentUnit, listIncidentUnits } from '@/lib/forge-platform/incidents'
export async function GET(_request:Request,context:{params:Promise<{id:string}>}){try{const {id}=await context.params;return NextResponse.json(await listIncidentUnits(id))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load units.'},{status:400})}}
export async function POST(request:Request,context:{params:Promise<{id:string}>}){try{const {id}=await context.params;return NextResponse.json(await addIncidentUnit(id,await request.json()),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to assign unit.'},{status:400})}}
