import { NextResponse } from 'next/server'
import { addReviewComment, listReviewComments } from '@/lib/forge-platform/incidents'

export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
  try{const {id}=await context.params;return NextResponse.json(await listReviewComments(id))}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to load review comments.'},{status:400})}
}

export async function POST(request:Request,context:{params:Promise<{id:string}>}){
  try{const {id}=await context.params;const body=await request.json();return NextResponse.json(await addReviewComment(id,String(body.body||'')),{status:201})}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to add review comment.'},{status:400})}
}
