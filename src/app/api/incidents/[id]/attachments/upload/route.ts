import { NextResponse } from 'next/server'
import { uploadIncidentAttachment } from '@/lib/forge-platform/specialty'

export async function POST(request:Request,context:{params:Promise<{id:string}>}){
  try{
    const {id}=await context.params
    const form=await request.formData()
    const file=form.get('file')
    if(!(file instanceof File))return NextResponse.json({error:'File is required.'},{status:400})
    return NextResponse.json(await uploadIncidentAttachment(id,file,{
      category:String(form.get('category')||'OTHER'),
      caption:String(form.get('caption')||'')||undefined,
      specialtySection:String(form.get('specialtySection')||'')||undefined,
      securityClassification:String(form.get('securityClassification')||'INTERNAL')
    }),{status:201})
  }catch(error){
    const status=typeof error==='object'&&error&&'status'in error?Number(error.status):400
    return NextResponse.json({error:error instanceof Error?error.message:'Unable to upload attachment.'},{status})
  }
}
