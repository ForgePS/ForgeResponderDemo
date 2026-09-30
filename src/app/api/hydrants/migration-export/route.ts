import { NextResponse } from 'next/server'
import { buildStandaloneHydrantMigrationBundle } from '@/lib/forge-platform/hydrants'
import { getForgePlatformMode } from '@/lib/forge-platform/server'

export async function GET(){
  try{
    if(getForgePlatformMode()!=='demo'){
      return NextResponse.json({error:'Hydrant migration export is only available for the standalone Responder dataset.'},{status:409})
    }
    const bundle=buildStandaloneHydrantMigrationBundle()
    return new NextResponse(JSON.stringify(bundle,null,2)+'\n',{
      status:200,
      headers:{
        'Content-Type':'application/json; charset=utf-8',
        'Content-Disposition':`attachment; filename="forge-responder-hydrants-${new Date().toISOString().slice(0,10)}.json"`,
        'Cache-Control':'no-store'
      }
    })
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:'Unable to export hydrant migration bundle.'},{status:400})
  }
}
