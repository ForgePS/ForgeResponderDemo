import 'server-only'

import { randomUUID } from 'node:crypto'

import { getIncident, getNarrative, saveNarrative } from '@/lib/forge-platform/incidents'
import { listSpecialtyRecords } from '@/lib/forge-platform/specialty'
import {
  ForgePlatformApiError,
  forgePlatformGet,
  forgePlatformSend,
  getForgePlatformMode,
  type ForgePlatformResult
} from '@/lib/forge-platform/server'

export type AiNarrativeRequestType =
  | 'GENERATE_FROM_RECORD'
  | 'IMPROVE_EXISTING'
  | 'GRAMMAR_AND_CLARITY'
  | 'EXPAND_BRIEF_NOTES'
  | 'CONDENSE'
  | 'PROFESSIONALIZE'
  | 'ACTIVE_VOICE'
  | 'TIMELINE_FORMAT'
  | 'QUALITY_REVIEW'
  | 'MISSING_INFORMATION_CHECK'
  | 'CONTRADICTION_CHECK'

export type AiNarrativeDraft={
  id:string
  draftText:string
  structuredResponseJson:{
    narrative?:string
    missingInformation?:string[]
    conflicts?:string[]
    warnings?:string[]
    unsupportedClaims?:string[]
    sourceReferences?:string[]
  }
  confidenceSummary:string|null
  label:string
  version:number
  acceptedAt:string|null
}

export type AiNarrativeBundle={
  request:{id:string;status:string;requestType:string;product:string;module:string;recordType:string;recordId:string;provider:string|null;createdAt:string}
  drafts:AiNarrativeDraft[]
  requiredWarning:string
  humanReviewRequired:boolean
}

function sentence(value:string){
  const trimmed=value.trim()
  if(!trimmed)return ''
  return /[.!?]$/.test(trimmed)?trimmed:`${trimmed}.`
}

async function localBundle(incidentId:string,requestType:AiNarrativeRequestType):Promise<ForgePlatformResult<AiNarrativeBundle>>{
  const incident=(await getIncident(incidentId)).data
  const current=(await getNarrative(incidentId)).data?.body?.trim()||''
  const [exposures,hazmat,alarms,protection]=await Promise.all([
    listSpecialtyRecords('exposures',incidentId),
    listSpecialtyRecords('hazmat-substances',incidentId),
    listSpecialtyRecords('alarm-systems',incidentId),
    listSpecialtyRecords('protection-systems',incidentId)
  ])

  const missing:string[]=[]
  if(!incident.dispatchDescription)missing.push('Dispatch description is not recorded.')
  if(!incident.primaryIncidentTypeCode)missing.push('Primary incident type is not recorded.')
  if(!current)missing.push('No existing narrative is recorded.')

  const details:string[]=[]
  if(incident.dispatchDescription)details.push(`Units were dispatched for ${sentence(incident.dispatchDescription).replace(/\.$/,'')}`)
  if(incident.primaryIncidentTypeCode)details.push(`The incident was classified as ${incident.primaryIncidentTypeCode.replaceAll('_',' ').toLowerCase()}.`)
  if(incident.responseDistrict)details.push(`The response district was ${incident.responseDistrict}.`)

  const exposureRows=exposures.data.filter(row=>String(row.status||'ACTIVE')!=='ARCHIVED')
  if(exposureRows.length)details.push(`${exposureRows.length} exposure record${exposureRows.length===1?' was':'s were'} documented.`)

  const hazmatRows=hazmat.data.filter(row=>String(row.status||'ACTIVE')!=='ARCHIVED')
  if(hazmatRows.length){
    const products=hazmatRows.map(row=>String(row.productName||'unknown product')).join(', ')
    details.push(`Hazardous materials involvement was documented for ${products}.`)
  }

  const alarmRows=alarms.data.filter(row=>String(row.status||'ACTIVE')!=='ARCHIVED')
  if(alarmRows.length)details.push(`Alarm-system information was documented in ${alarmRows.length} record${alarmRows.length===1?'':'s'}.`)

  const protectionRows=protection.data.filter(row=>String(row.status||'ACTIVE')!=='ARCHIVED')
  if(protectionRows.length)details.push(`Fire-protection system information was documented in ${protectionRows.length} record${protectionRows.length===1?'':'s'}.`)

  let draft=current
  if(requestType==='GENERATE_FROM_RECORD'||!draft){
    draft=details.join(' ')
  }else if(requestType==='CONDENSE'){
    draft=current.split(/(?<=[.!?])\s+/).slice(0,4).join(' ')
  }else if(requestType==='TIMELINE_FORMAT'){
    draft=current.split(/(?<=[.!?])\s+/).filter(Boolean).map((line,index)=>`${index+1}. ${line}`).join('\n')
  }else if(requestType==='QUALITY_REVIEW'||requestType==='MISSING_INFORMATION_CHECK'||requestType==='CONTRADICTION_CHECK'){
    draft=current
  }else{
    draft=sentence(current)
  }

  if(!draft)draft='Narrative draft could not be generated because the incident record does not yet contain enough documented information.'

  const now=new Date().toISOString()
  const requestId=randomUUID()
  const draftId=randomUUID()
  const bundle:AiNarrativeBundle={
    request:{id:requestId,status:'COMPLETED',requestType,product:'RMS',module:'INCIDENT_NARRATIVE',recordType:'NERIS_INCIDENT',recordId:incidentId,provider:'STANDALONE_RECORD_GROUNDED',createdAt:now},
    drafts:[{
      id:draftId,
      draftText:draft,
      structuredResponseJson:{
        narrative:draft,
        missingInformation:missing,
        conflicts:[],
        warnings:['Standalone demo mode uses deterministic record-grounded drafting, not an external AI provider.'],
        unsupportedClaims:[],
        sourceReferences:['incident','incident narrative','specialty records']
      },
      confidenceSummary:missing.length?'Record has missing information; officer review is required.':'Draft is grounded in currently recorded incident fields.',
      label:'Record-grounded draft',
      version:1,
      acceptedAt:null
    }],
    requiredWarning:'AI-assisted content requires human review before it becomes part of the official incident record.',
    humanReviewRequired:true
  }
  return {data:bundle,source:'demo'}
}

export async function createAiNarrative(incidentId:string,requestType:AiNarrativeRequestType,existingNarrative?:string|null):Promise<ForgePlatformResult<AiNarrativeBundle>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{
      return await forgePlatformSend<AiNarrativeBundle>('/api/v1/ai/narratives','POST',{
        product:'RMS',
        module:'INCIDENT_NARRATIVE',
        recordType:'NERIS_INCIDENT',
        recordId:incidentId,
        requestType,
        acknowledgeWarning:true,
        existingNarrative:existingNarrative||null,
        tone:'NEUTRAL',
        detailLevel:'STANDARD',
        includeCategories:[],
        excludeCategories:[],
        authorizeSensitiveData:false,
        idempotencyKey:`responder-demo-ai-${randomUUID()}`
      })
    }catch(error){
      if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error
    }
  }
  return localBundle(incidentId,requestType)
}

export async function acceptAiNarrative(
  incidentId:string,
  requestId:string,
  draftId:string,
  draftText:string,
  recordVersion:number
):Promise<ForgePlatformResult<{narrative:string;recordVersion:number}>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{
      await forgePlatformSend<AiNarrativeBundle>(`/api/v1/ai/narratives/${requestId}/accept`,'POST',{
        draftId,
        mode:'ACCEPT_ALL',
        insertIntoRecord:true
      })
      const narrative=await getNarrative(incidentId)
      return {data:{narrative:narrative.data?.body||draftText,recordVersion:narrative.data?.recordVersion||recordVersion},source:'platform'}
    }catch(error){
      if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error
    }
  }
  const saved=await saveNarrative(incidentId,draftText,recordVersion,'Accepted record-grounded assistant draft')
  return {data:{narrative:saved.data.body,recordVersion:saved.data.recordVersion},source:'demo'}
}
