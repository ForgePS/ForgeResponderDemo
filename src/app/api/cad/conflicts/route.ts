import { NextResponse } from 'next/server'
import { listCadConflicts } from '@/lib/forge-platform/cad'
export async function GET(request:Request){try{const url=new URL(request.url);const query:Record<string,string>={};for(const key of ['status','incidentId']){const value=url.searchParams.get(key);if(value)query[key]=value}return NextResponse.json(await listCadConflicts(query))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load CAD conflicts.'},{status:400})}}
