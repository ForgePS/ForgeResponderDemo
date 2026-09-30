import 'server-only'

import {
  ForgePlatformApiError,
  forgePlatformGet,
  getForgePlatformMode,
  getForgeTenantId,
  type ForgePlatformResult
} from '@/lib/forge-platform/server'

export type CadConflict={
  id:string
  incidentId:string|null
  conflictType:string
  status:string
  severity:string
  fieldIdentifier:string|null
  resolutionReason:string|null
  recordVersion:number
  createdAt:string
}

export type CadIncidentStatus={
  links:Array<{
    id:string
    cadConnectionId:string
    sourceIncidentId:string
    sourceIncidentNumber:string|null
    linkStatus:string
    linkMethod:string
    recordVersion:number
    updatedAt:string
  }>
  openConflicts:CadConflict[]
  operatingHints:{linked:boolean;conflictCount:number}
}

export async function getCadIncidentStatus(incidentId:string):Promise<ForgePlatformResult<CadIncidentStatus>>{
  const mode=getForgePlatformMode()
  if(mode==='demo'){
    return {
      data:{links:[],openConflicts:[],operatingHints:{linked:false,conflictCount:0}},
      source:'demo'
    }
  }
  try{
    return await forgePlatformGet<CadIncidentStatus>(
      `/api/v1/tenants/${getForgeTenantId()}/neris/incidents/${incidentId}/cad-status`
    )
  }catch(error){
    if(mode==='auto'&&error instanceof ForgePlatformApiError){
      return {
        data:{links:[],openConflicts:[],operatingHints:{linked:false,conflictCount:0}},
        source:'demo'
      }
    }
    throw error
  }
}
