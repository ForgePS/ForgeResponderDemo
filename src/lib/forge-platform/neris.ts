import 'server-only'

import { createHash, randomUUID } from 'node:crypto'

import { nerisModules, nerisValueSets, humanizeNerisName, type NerisField } from '@/utils/nerisSchema'
import { readForgeData, writeForgeData } from '@/utils/forgeDataStore'
import {
  ForgePlatformApiError,
  forgePlatformGet,
  forgePlatformSend,
  getForgePlatformMode,
  getForgeTenantId,
  recordVersionToIfMatch,
  type ForgePlatformResult
} from '@/lib/forge-platform/server'
import { getIncident, patchIncident, validateIncident as validateBaseIncident } from '@/lib/forge-platform/incidents'

export type NerisFieldValueState = {
  valueText?: string | null
  valueNumber?: number | null
  valueBoolean?: boolean | null
  valueTimestamp?: string | null
  valueOptionId?: string | null
  valueJson?: unknown
  prefillSource?: 'TENANT_DEFAULT'|'USER_DEFAULT'|'ROSTER'|'PERSONNEL'|'APPARATUS'|'OCCUPANCY'|'PREPLAN'|'MANUAL'|'COMPUTED'|'CAD'|'FUTURE_CAD'|null
  userConfirmed?: boolean
}

export type FormDescriptorField = {
  fieldId: string
  fieldKey: string
  definition: string
  dataType: string | null
  required: boolean
  displayLabel: string
  helpText?: string | null
  localAlias?: string | null
  displayOrder: number
  visible: boolean
  valueSetLocation?: string | null
  valueOverlays?: unknown[]
}

export type FormDescriptorModule = {
  moduleKey: string
  name: string
  area: string | null
  sectionKey: string
  specialtyGroupId?: string | null
  visible: boolean
  fields: FormDescriptorField[]
}

export type SpecialtyWorkflowGroup = {
  id: string
  sectionKey: string
  label: string
  plainLanguageSummary: string
  state: 'HIDDEN' | 'OPTIONAL' | 'REQUIRED' | 'ACTIVE' | 'NOT_APPLICABLE'
  required: boolean
  allowNotApplicable: boolean
  activationReasons: string[]
  moduleKeys: string[]
  presentModuleKeys: string[]
  repeatableHints: string[]
  fieldCount?: number
  requiredFieldCount?: number
  filledRequiredFieldCount?: number
  completionPercent?: number
  hasBlockingGaps?: boolean
}

export type FormDescriptor = {
  schemaVersionId: string | null
  operatingMode: string
  sections: string[]
  navigationSections?: string[]
  specialtyWorkflows?: SpecialtyWorkflowGroup[]
  availableSpecialtySections?: Array<{sectionKey:string;label:string;summary:string}>
  modules: FormDescriptorModule[]
}

type StoredFieldValue = {
  id: string
  incidentId: string
  fieldId: string
  fieldKey: string
  sectionKey: string
  value: NerisFieldValueState
  updatedAt: string
}

type SpecialtyState = {
  id: string
  incidentId: string
  sectionKey: string
  state: 'ACTIVE' | 'NOT_APPLICABLE'
  updatedAt: string
}

const CORE_SECTIONS=['OVERVIEW','DISPATCH','LOCATION','UNITS_PERSONNEL','CLASSIFICATION','NARRATIVE','ATTACHMENTS','REVIEW']

const SPECIALTY_MODULES:Record<string,{sectionKey:string;label:string;summary:string}>={
  mod_structure_fire:{sectionKey:'STRUCTURE_FIRE',label:'Structure Fire',summary:'Structure-fire conditions, origin, building and inspection details.'},
  mod_outdoor_fire:{sectionKey:'OUTDOOR_FIRE',label:'Outdoor Fire',summary:'Outdoor fire conditions, fuels, spread and control details.'},
  mod_transportation_fire:{sectionKey:'TRANSPORTATION_FIRE',label:'Transportation Fire',summary:'Vehicle and transportation fire reporting details.'},
  mod_battery_incident:{sectionKey:'BATTERY_INCIDENT',label:'Battery Incident',summary:'Battery and energy-storage incident details.'},
  mod_hazsit:{sectionKey:'HAZMAT',label:'Hazardous Materials',summary:'Hazardous material, release, quantity and mitigation details.'},
  mod_casualty_ff:{sectionKey:'FIRE_SERVICE_CASUALTY',label:'Fire Service Casualty',summary:'Fire-service injury and casualty reporting.'},
  mod_casualty_nonff:{sectionKey:'CIVILIAN_CASUALTY',label:'Civilian Casualty',summary:'Civilian injury and casualty reporting.'},
  mod_personnel_injury:{sectionKey:'PERSONNEL_INJURY',label:'Personnel Injury',summary:'Personnel injury circumstances and outcomes.'}
}

function base(id:string){return `/api/v1/tenants/${getForgeTenantId()}/neris/incidents/${id}`}

function fieldId(moduleKey:string,fieldKey:string){return `demo:${moduleKey}:${fieldKey}`}

function coreSection(moduleKey:string){
  const key=moduleKey.toUpperCase()
  if(key.includes('DISPATCH'))return 'DISPATCH'
  if(key.includes('CIVIC_LOCATION')||key.includes('LOCATION')||key.includes('PARCEL'))return 'LOCATION'
  if(key.includes('UNIT')||key.includes('PERSONNEL')||key.includes('CREW'))return 'UNITS_PERSONNEL'
  if(key.includes('WEATHER'))return 'DISPATCH'
  return 'CLASSIFICATION'
}

function localValueMap(incidentId:string){
  const rows=readForgeData<StoredFieldValue[]>('incident-field-values').filter(x=>x.incidentId===incidentId)
  return new Map(rows.map(row=>[row.fieldKey,row]))
}

function localSpecialtyMap(incidentId:string){
  const rows=readForgeData<SpecialtyState[]>('incident-specialty-sections').filter(x=>x.incidentId===incidentId)
  return new Map(rows.map(row=>[row.sectionKey,row]))
}

function isFilled(value?:NerisFieldValueState){
  if(!value)return false
  return Object.values(value).some(v=>v!==null&&v!==undefined&&v!=='')
}

function fieldToDescriptor(moduleKey:string,field:NerisField,index:number):FormDescriptorField{
  const fieldKey=String(field.name||`field_${index+1}`)
  return {
    fieldId:fieldId(moduleKey,fieldKey),
    fieldKey,
    definition:String(field.description||field.definition||humanizeNerisName(fieldKey)),
    dataType:field.type?String(field.type):null,
    required:Boolean(field.db_required),
    displayLabel:humanizeNerisName(fieldKey),
    helpText:String(field.description||field.comments||'')||null,
    displayOrder:index,
    visible:!field.computed,
    valueSetLocation:field.value_set_location?String(field.value_set_location):null,
    valueOverlays:[]
  }
}

function localDescriptor(incidentId:string):FormDescriptor{
  const values=localValueMap(incidentId)
  const specialty=localSpecialtyMap(incidentId)
  const modules:FormDescriptorModule[]=[]
  const specialtyGroups:SpecialtyWorkflowGroup[]=[]

  for(const mod of nerisModules){
    const specialtyMeta=SPECIALTY_MODULES[mod.module]
    if(specialtyMeta){
      const state=specialty.get(specialtyMeta.sectionKey)?.state || 'OPTIONAL'
      const fields=mod.fields.map((field,index)=>fieldToDescriptor(mod.module,field,index)).filter(field=>field.visible)
      const required=fields.filter(field=>field.required)
      const filled=fields.filter(field=>isFilled(values.get(field.fieldKey)?.value))
      const filledRequired=required.filter(field=>isFilled(values.get(field.fieldKey)?.value))
      specialtyGroups.push({
        id:`demo-specialty:${specialtyMeta.sectionKey}`,
        sectionKey:specialtyMeta.sectionKey,
        label:specialtyMeta.label,
        plainLanguageSummary:specialtyMeta.summary,
        state,
        required:false,
        allowNotApplicable:true,
        activationReasons:[],
        moduleKeys:[mod.module],
        presentModuleKeys:state==='ACTIVE'||state==='NOT_APPLICABLE'?[mod.module]:[],
        repeatableHints:[],
        fieldCount:fields.length,
        requiredFieldCount:required.length,
        filledRequiredFieldCount:filledRequired.length,
        completionPercent:fields.length?Math.round((filled.length/fields.length)*100):0,
        hasBlockingGaps:false
      })
      if(state==='ACTIVE'||state==='NOT_APPLICABLE'){
        modules.push({moduleKey:mod.module,name:humanizeNerisName(mod.module),area:mod.group,sectionKey:specialtyMeta.sectionKey,specialtyGroupId:`demo-specialty:${specialtyMeta.sectionKey}`,visible:true,fields})
      }
      continue
    }

    if(mod.group!=='core')continue
    modules.push({
      moduleKey:mod.module,
      name:humanizeNerisName(mod.module),
      area:mod.group,
      sectionKey:coreSection(mod.module),
      visible:true,
      fields:mod.fields.map((field,index)=>fieldToDescriptor(mod.module,field,index)).filter(field=>field.visible)
    })
  }

  const activeSpecialties=specialtyGroups.filter(x=>x.state==='ACTIVE'||x.state==='NOT_APPLICABLE').map(x=>x.sectionKey)
  return {
    schemaVersionId:'demo-neris-v1-catalog',
    operatingMode:'MANUAL_ONLY',
    sections:[...CORE_SECTIONS,...activeSpecialties],
    navigationSections:[...CORE_SECTIONS,...activeSpecialties],
    specialtyWorkflows:specialtyGroups,
    availableSpecialtySections:specialtyGroups.filter(x=>x.state==='OPTIONAL').map(x=>({sectionKey:x.sectionKey,label:x.label,summary:x.plainLanguageSummary})),
    modules
  }
}

export async function getFormDescriptor(incidentId:string):Promise<ForgePlatformResult<FormDescriptor>>{
  const mode=getForgePlatformMode()
  if(mode==='demo')return {data:localDescriptor(incidentId),source:'demo'}
  try{return await forgePlatformGet<FormDescriptor>(`${base(incidentId)}/form-descriptor`)}
  catch(error){if(mode==='auto'&&error instanceof ForgePlatformApiError)return {data:localDescriptor(incidentId),source:'demo'};throw error}
}

export async function listFieldValues(incidentId:string):Promise<ForgePlatformResult<Record<string,NerisFieldValueState>>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{
      const result=await forgePlatformGet<Array<{
        fieldId:string
        valueText:string|null
        valueNumber:string|null
        valueBoolean:boolean|null
        valueTimestamp:string|null
        valueOptionId:string|null
        valueJson:unknown
        prefillSource:NerisFieldValueState['prefillSource']
        userConfirmed:boolean
      }>>(`${base(incidentId)}/field-values`)
      return {
        data:Object.fromEntries(result.data.map(row=>[
          row.fieldId,
          {
            valueText:row.valueText,
            valueNumber:row.valueNumber===null?null:Number(row.valueNumber),
            valueBoolean:row.valueBoolean,
            valueTimestamp:row.valueTimestamp,
            valueOptionId:row.valueOptionId,
            valueJson:row.valueJson,
            prefillSource:row.prefillSource,
            userConfirmed:row.userConfirmed
          }
        ])),
        source:'platform'
      }
    }catch(error){
      if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error
    }
  }
  const rows=readForgeData<StoredFieldValue[]>('incident-field-values').filter(x=>x.incidentId===incidentId)
  return {data:Object.fromEntries(rows.map(row=>[row.fieldId,row.value])),source:'demo'}
}

export async function batchFieldValues(
  incidentId:string,
  values:Array<{fieldId:string;fieldKey?:string;sectionKey:string}&NerisFieldValueState>,
  recordVersion:number
):Promise<ForgePlatformResult<{incident:Awaited<ReturnType<typeof getIncident>>['data'];upserted:number}>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{
      const result=await forgePlatformSend<{
        incident:Awaited<ReturnType<typeof getIncident>>['data']
        upserted?:number
        values?:Array<{
          fieldId:string
          sectionKey:string
          repeatableItemId?:string|null
          prefillSource?:string|null
          userConfirmed?:boolean
        }>
      }>(`${base(incidentId)}/field-values`,'PATCH',{values},{ifMatch:recordVersionToIfMatch(recordVersion)})

      let upserted=Number.isFinite(result.data.upserted)?Number(result.data.upserted):values.length
      if(!Number.isFinite(result.data.upserted)&&Array.isArray(result.data.values)){
        upserted=values.filter(requested=>{
          const returned=result.data.values?.find(row=>
            row.fieldId===requested.fieldId&&
            row.sectionKey===requested.sectionKey
          )
          if(!returned)return false
          if(requested.userConfirmed===false&&returned.userConfirmed===true)return false
          if(requested.prefillSource&&returned.prefillSource&&requested.prefillSource!==returned.prefillSource)return false
          return true
        }).length
      }

      return {
        data:{incident:result.data.incident,upserted},
        source:result.source,
        etag:result.etag,
        meta:result.meta
      }
    }catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }

  const descriptor=localDescriptor(incidentId)
  const fieldById=new Map(descriptor.modules.flatMap(m=>m.fields).map(field=>[field.fieldId,field]))
  const rows=readForgeData<StoredFieldValue[]>('incident-field-values')
  const provenanceRows=readForgeData<Array<Record<string,unknown>>>('cad-field-provenance')
  const now=new Date().toISOString()
  let provenanceChanged=false
  let upserted=0
  for(const item of values){
    const known=fieldById.get(item.fieldId)
    const fieldKey=item.fieldKey||known?.fieldKey||item.fieldId
    const value:NerisFieldValueState={
      valueText:item.valueText??null,
      valueNumber:item.valueNumber??null,
      valueBoolean:item.valueBoolean??null,
      valueTimestamp:item.valueTimestamp??null,
      valueOptionId:item.valueOptionId??null,
      valueJson:item.valueJson??null,
      prefillSource:(item as NerisFieldValueState).prefillSource??'MANUAL',
      userConfirmed:(item as NerisFieldValueState).userConfirmed??true
    }
    const index=rows.findIndex(row=>row.incidentId===incidentId&&row.fieldId===item.fieldId)
    const existing=index>=0?rows[index]:null
    if(existing?.value.userConfirmed===true&&value.userConfirmed===false)continue
    const stored={id:existing?.id||randomUUID(),incidentId,fieldId:item.fieldId,fieldKey,sectionKey:item.sectionKey,value,updatedAt:now}
    if(index>=0)rows[index]=stored
    else rows.push(stored)

    const provenanceIndex=provenanceRows.findIndex(row=>
      row.incidentId===incidentId&&row.fieldIdentifier===`neris.${fieldKey}`
    )
    const provenance=provenanceIndex>=0?provenanceRows[provenanceIndex]:null

    if(value.prefillSource==='CAD'){
      const sourceValueHash=createHash('sha256').update(JSON.stringify({
        valueText:value.valueText,
        valueNumber:value.valueNumber,
        valueBoolean:value.valueBoolean,
        valueTimestamp:value.valueTimestamp,
        valueOptionId:value.valueOptionId,
        valueJson:value.valueJson
      })).digest('hex')
      const next={
        id:provenance?.id||randomUUID(),
        incidentId,
        fieldIdentifier:`neris.${fieldKey}`,
        currentValueSource:'CAD',
        sourceSystem:'CAD',
        cadConnectionId:provenance?.cadConnectionId||null,
        cadRawMessageId:provenance?.cadRawMessageId||null,
        cadNormalizedEventId:provenance?.cadNormalizedEventId||null,
        sourcePath:provenance?.sourcePath||null,
        sourceValueHash,
        mappingProfileId:provenance?.mappingProfileId||null,
        mappingVersion:provenance?.mappingVersion||null,
        appliedAt:provenance?.appliedAt||now,
        appliedByUserId:null,
        manualOverrideAt:null,
        manualOverrideByUserId:null,
        manualOverrideReason:null,
        ownershipPolicy:'CAD_UNTIL_MANUAL_EDIT',
        recordVersion:Number(provenance?.recordVersion||0)+1,
        createdAt:provenance?.createdAt||now,
        updatedAt:now
      }
      if(provenanceIndex>=0)provenanceRows[provenanceIndex]=next
      else provenanceRows.push(next)
      provenanceChanged=true
    }else if(existing?.value.prefillSource==='CAD'&&value.prefillSource==='MANUAL'&&provenance){
      provenanceRows[provenanceIndex]={
        ...provenance,
        currentValueSource:'FORGE',
        manualOverrideAt:now,
        manualOverrideByUserId:'demo-user',
        manualOverrideReason:'Officer edited CAD-prefilled NERIS value',
        recordVersion:Number(provenance.recordVersion||1)+1,
        updatedAt:now
      }
      provenanceChanged=true
    }

    upserted+=1
  }
  if(upserted===0){
    return {data:{incident:(await getIncident(incidentId)).data,upserted:0},source:'demo'}
  }
  writeForgeData('incident-field-values',rows)
  if(provenanceChanged)writeForgeData('cad-field-provenance',provenanceRows)
  const patched=await patchIncident(incidentId,{},recordVersion)
  return {data:{incident:patched.data,upserted},source:'demo'}
}

export async function updateSpecialtySection(
  incidentId:string,
  sectionKey:string,
  action:'ACTIVATE'|'MARK_NOT_APPLICABLE'|'CLEAR_NOT_APPLICABLE'
):Promise<ForgePlatformResult<{incidentId:string;sectionKey:string;status:string}>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{return await forgePlatformSend<{incidentId:string;sectionKey:string;status:string}>(`${base(incidentId)}/specialty-sections`,'POST',{sectionKey,action})}
    catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  const rows=readForgeData<SpecialtyState[]>('incident-specialty-sections')
  const index=rows.findIndex(row=>row.incidentId===incidentId&&row.sectionKey===sectionKey)
  if(action==='CLEAR_NOT_APPLICABLE'){
    if(index>=0)rows.splice(index,1)
    writeForgeData('incident-specialty-sections',rows)
    return {data:{incidentId,sectionKey,status:'OPTIONAL'},source:'demo'}
  }
  const next:SpecialtyState={id:index>=0?rows[index].id:randomUUID(),incidentId,sectionKey,state:action==='ACTIVATE'?'ACTIVE':'NOT_APPLICABLE',updatedAt:new Date().toISOString()}
  if(index>=0)rows[index]=next
  else rows.push(next)
  writeForgeData('incident-specialty-sections',rows)
  return {data:{incidentId,sectionKey,status:next.state},source:'demo'}
}

export async function lookupValueSetOptions(valueSetLocation:string,search=''):Promise<ForgePlatformResult<Array<{id:string;label:string;subtitle?:string}>>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{
      const encoded=encodeURIComponent(valueSetLocation)
      const result=await forgePlatformGet<Array<{id:string;code:string;label:string}>>(`/api/v1/platform/neris/value-sets/${encoded}/options`,{search,pageSize:25})
      return {data:result.data.map(row=>({id:row.id,label:row.label,subtitle:row.code})),source:'platform'}
    }catch(error){if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error}
  }
  const set=nerisValueSets[valueSetLocation]
  const q=search.trim().toLowerCase()
  const options=(set?.options||[]).map((row,index)=>{
    const id=String(row.id||row.code||row.value||`${valueSetLocation}:${index}`)
    const label=String(row.label||row.description||row.name||row.value||row.code||id)
    const subtitle=row.code?String(row.code):undefined
    return {id,label,subtitle}
  }).filter(row=>!q||row.label.toLowerCase().includes(q)||(row.subtitle||'').toLowerCase().includes(q)).slice(0,50)
  return {data:options,source:'demo'}
}


export async function validateNerisIncident(incidentId:string){
  const baseResult=await validateBaseIncident(incidentId)
  if(getForgePlatformMode()==='connected'||baseResult.source==='platform')return baseResult

  const descriptor=localDescriptor(incidentId)
  const values=localValueMap(incidentId)
  const extra=descriptor.modules
    .flatMap(module=>module.fields.map(field=>({module,field})))
    .filter(({field})=>field.required)
    .filter(({field})=>!isFilled(values.get(field.fieldKey)?.value))
    .map(({module,field})=>({
      severity:'BLOCKING_ERROR' as const,
      code:'NERIS_REQUIRED_FIELD_MISSING',
      message:`${field.displayLabel} is required.`,
      sectionKey:module.sectionKey
    }))

  const specialtyState=localSpecialtyMap(incidentId)
  const repeatableRequirements=[
    {sectionKey:'HAZMAT',entity:'incident-hazmat-substances',label:'Hazardous materials substance'},
    {sectionKey:'CIVILIAN_CASUALTY',entity:'incident-civilian-casualties',label:'Civilian casualty'},
    {sectionKey:'FIRE_SERVICE_CASUALTY',entity:'incident-fire-service-casualties',label:'Fire-service casualty'}
  ]
  const specialtyFindings=repeatableRequirements.flatMap(requirement=>{
    if(specialtyState.get(requirement.sectionKey)?.state!=='ACTIVE')return []
    const count=readForgeData<Array<Record<string,unknown>>>(requirement.entity)
      .filter(row=>row.incidentId===incidentId&&String(row.status||'ACTIVE')!=='ARCHIVED').length
    if(count>0)return []
    return [{
      severity:'BLOCKING_ERROR' as const,
      code:'NERIS_SPECIALTY_RECORD_REQUIRED',
      message:`${requirement.label} record is required because this specialty workflow is active.`,
      sectionKey:requirement.sectionKey
    }]
  })

  const findings=[...baseResult.data.findings,...extra,...specialtyFindings]
  return {
    data:{
      ...baseResult.data,
      ok:!findings.some(item=>item.severity==='BLOCKING_ERROR'),
      findings,
      blockingErrorCount:findings.filter(item=>item.severity==='BLOCKING_ERROR').length,
      warningCount:findings.filter(item=>item.severity==='WARNING').length,
      guidanceCount:findings.filter(item=>item.severity==='GUIDANCE').length
    },
    source:'demo' as const
  }
}
