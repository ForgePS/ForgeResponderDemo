import { NextResponse } from 'next/server'
import { submitForReview } from '@/lib/forge-platform/incidents'
export async function POST(request:Request,context:{params:Promise<{id:string}>}){try{const {id}=await context.params;const body=await request.json().catch(()=>({}));return NextResponse.json(await submitForReview(id,body.note?String(body.note):undefined))}catch(error){const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400;return NextResponse.json({error:error instanceof Error?error.message:'Unable to submit incident.'},{status})}}
