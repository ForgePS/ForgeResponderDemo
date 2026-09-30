import { NextResponse } from 'next/server'
import { lookupValueSetOptions } from '@/lib/forge-platform/neris'

export async function GET(request:Request){
  try{const url=new URL(request.url);const location=url.searchParams.get('location')||'';const search=url.searchParams.get('search')||'';if(!location)return NextResponse.json({data:[],source:'demo'});return NextResponse.json(await lookupValueSetOptions(location,search))}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load NERIS value-set options.'},{status:400})}
}
