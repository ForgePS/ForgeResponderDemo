import { NextResponse } from 'next/server'
import { createIncident, listIncidents } from '@/lib/forge-platform/incidents'

export async function GET(){
  try{return NextResponse.json(await listIncidents())}
  catch(error){const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400;return NextResponse.json({error:error instanceof Error?error.message:'Unable to load incidents.'},{status})}
}

export async function POST(request:Request){
  try{return NextResponse.json(await createIncident(await request.json()),{status:201})}
  catch(error){const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400;return NextResponse.json({error:error instanceof Error?error.message:'Unable to create incident.'},{status})}
}
