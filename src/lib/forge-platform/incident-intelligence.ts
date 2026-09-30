import 'server-only'

import { readForgeData } from '@/utils/forgeDataStore'
import { listCadMessages } from '@/lib/forge-platform/cad'
import { listRmsMasterData } from '@/lib/forge-platform/rms'
import {
  ForgePlatformApiError,
  forgePlatformGet,
  getForgePlatformMode,
  getForgeTenantId,
  type ForgePlatformResult
} from '@/lib/forge-platform/server'

type Address={
  addressLine1?:string|null
  city?:string|null
  state?:string|null
  postalCode?:string|null
}

type Location={
  latitude?:number|null
  longitude?:number|null
  occupancyId?:string|null
  preplanId?:string|null
  locationDescription?:string|null
}

type Occupancy=Record<string,unknown>&{
  id:string
  name?:string
  addressLine1?:string|null
  address?:string|null
  city?:string|null
  state?:string|null
  postalCode?:string|null
  latitude?:number|null
  longitude?:number|null
  preplanId?:string|null
  occupancyType?:string|null
  status?:string|null
}

type Preplan=Record<string,unknown>&{
  id:string
  occupancyId?:string|null
  approvalStatus?:string|null
  publicationStatus?:string|null
  versionLabel?:string|null
  tacticalSummary?:string|null
  hazards?:string|null|unknown[]
  accessNotes?:string|null
  utilityNotes?:string|null
}

type Hydrant=Record<string,unknown>&{
  id:string
  displayId?:string|null
  address?:string|null
  city?:string|null
  latitude?:number|null
  longitude?:number|null
  status?:string|null
  flowGpm?:number|null
  staticPsi?:number|null
  residualPsi?:number|null
  nfpaClass?:string|null
  nfpaColor?:string|null
  waterProvider?:string|null
}

export type IncidentIntelligence={
  incidentId:string
  source:'platform'|'demo'
  matchMethod:'LINKED'|'ADDRESS'|'PROXIMITY'|'NONE'
  address:Address|null
  latitude:number|null
  longitude:number|null
  occupancy:Occupancy|null
  preplan:Preplan|null
  nearbyHydrants:Array<Hydrant&{distanceFeet:number}>
  warnings:string[]
}

function normalize(value:unknown){
  return String(value||'')
    .toLowerCase()
    .replace(/\b(street)\b/g,'st')
    .replace(/\b(road)\b/g,'rd')
    .replace(/\b(avenue)\b/g,'ave')
    .replace(/\b(boulevard)\b/g,'blvd')
    .replace(/\b(drive)\b/g,'dr')
    .replace(/[^a-z0-9]/g,'')
}

function feetBetween(aLat:number,aLon:number,bLat:number,bLon:number){
  const rad=(value:number)=>value*Math.PI/180
  const earthFeet=20902231
  const dLat=rad(bLat-aLat)
  const dLon=rad(bLon-aLon)
  const x=Math.sin(dLat/2)**2+Math.cos(rad(aLat))*Math.cos(rad(bLat))*Math.sin(dLon/2)**2
  return Math.round(2*earthFeet*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)))
}

async function loadLocationContext(incidentId:string):Promise<ForgePlatformResult<{location:Location|null;primaryAddress:Address|null}>>{
  const mode=getForgePlatformMode()
  if(mode!=='demo'){
    try{
      return await forgePlatformGet<{location:Location|null;primaryAddress:Address|null}>(
        `/api/v1/tenants/${getForgeTenantId()}/neris/incidents/${incidentId}/location-context`
      )
    }catch(error){
      if(!(mode==='auto'&&error instanceof ForgePlatformApiError))throw error
    }
  }

  const messages=(await listCadMessages()).data
    .filter(message=>message.appliedIncidentId===incidentId)
    .sort((a,b)=>Date.parse(b.receivedAt)-Date.parse(a.receivedAt))
  const message=messages[0]
  const loc=message?.simulatedLocation
  return {
    data:{
      location:loc?{
        latitude:loc.latitude??null,
        longitude:loc.longitude??null,
        occupancyId:null,
        preplanId:null,
        locationDescription:loc.addressLine1||null
      }:null,
      primaryAddress:loc?{
        addressLine1:loc.addressLine1||null,
        city:loc.city||null,
        state:loc.state||null,
        postalCode:loc.postalCode||null
      }:null
    },
    source:'demo'
  }
}

export async function getIncidentIntelligence(incidentId:string):Promise<ForgePlatformResult<IncidentIntelligence>>{
  const [context,occupanciesResult,preplansResult]=await Promise.all([
    loadLocationContext(incidentId),
    listRmsMasterData<Occupancy>('occupancies'),
    listRmsMasterData<Preplan>('preplans')
  ])

  const location=context.data.location
  const address=context.data.primaryAddress
  const occupancies=occupanciesResult.data
  const preplans=preplansResult.data
  let occupancy:Occupancy|undefined
  let matchMethod:IncidentIntelligence['matchMethod']='NONE'

  if(location?.occupancyId){
    occupancy=occupancies.find(row=>row.id===location.occupancyId)
    if(occupancy)matchMethod='LINKED'
  }

  if(!occupancy&&address?.addressLine1){
    const target=normalize(address.addressLine1)
    occupancy=occupancies.find(row=>normalize(row.addressLine1||row.address)===target)
    if(occupancy)matchMethod='ADDRESS'
  }

  if(!occupancy&&location?.latitude!=null&&location?.longitude!=null){
    const candidates=occupancies
      .filter(row=>row.latitude!=null&&row.longitude!=null)
      .map(row=>({...row,distanceFeet:feetBetween(location.latitude!,location.longitude!,Number(row.latitude),Number(row.longitude))}))
      .sort((a,b)=>a.distanceFeet-b.distanceFeet)
    if(candidates[0]&&candidates[0].distanceFeet<=500){
      occupancy=candidates[0]
      matchMethod='PROXIMITY'
    }
  }

  let preplan:Preplan|undefined
  const linkedPreplanId=location?.preplanId||occupancy?.preplanId
  if(linkedPreplanId)preplan=preplans.find(row=>row.id===linkedPreplanId)
  if(!preplan&&occupancy){
    preplan=preplans
      .filter(row=>row.occupancyId===occupancy!.id)
      .sort((a,b)=>{
        const aApproved=(a.approvalStatus==='APPROVED'||a.publicationStatus==='published')?1:0
        const bApproved=(b.approvalStatus==='APPROVED'||b.publicationStatus==='published')?1:0
        return bApproved-aApproved
      })[0]
  }

  const hydrants=readForgeData<Hydrant[]>('hydrants')
  let nearbyHydrants:Array<Hydrant&{distanceFeet:number}>=[]
  if(location?.latitude!=null&&location?.longitude!=null){
    nearbyHydrants=hydrants
      .filter(row=>row.latitude!=null&&row.longitude!=null)
      .map(row=>({...row,distanceFeet:feetBetween(location.latitude!,location.longitude!,Number(row.latitude),Number(row.longitude))}))
      .filter(row=>row.distanceFeet<=2500)
      .sort((a,b)=>a.distanceFeet-b.distanceFeet)
      .slice(0,5)
  }

  const warnings:string[]=[]
  if(!occupancy)warnings.push('No known occupancy matched the incident location.')
  if(occupancy&&!preplan)warnings.push('Matched occupancy does not have an available preplan.')
  if(preplan&&preplan.approvalStatus&&preplan.approvalStatus!=='APPROVED')warnings.push('Available preplan is not approved.')
  if(!nearbyHydrants.length)warnings.push('No nearby hydrants were identified from the Responder-local hydrant dataset.')
  if(nearbyHydrants.some(row=>String(row.status||'').toLowerCase()!=='in service'))warnings.push('One or more nearby hydrants are not marked In Service.')

  const source=context.source==='platform'&&occupanciesResult.source==='platform'&&preplansResult.source==='platform'?'platform':'demo'
  return {
    data:{
      incidentId,
      source,
      matchMethod,
      address:address||null,
      latitude:location?.latitude??null,
      longitude:location?.longitude??null,
      occupancy:occupancy||null,
      preplan:preplan||null,
      nearbyHydrants,
      warnings
    },
    source
  }
}
