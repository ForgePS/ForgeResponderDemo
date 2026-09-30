'use client'

import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

type Hydrant={id:string;displayId?:string|null;address?:string|null;status?:string|null;flowGpm?:number|null;staticPsi?:number|null;residualPsi?:number|null;nfpaClass?:string|null;nfpaColor?:string|null;waterProvider?:string|null;distanceFeet:number}
type Intelligence={
  source:'platform'|'demo';matchMethod:'LINKED'|'ADDRESS'|'PROXIMITY'|'NONE';
  address:{addressLine1?:string|null;city?:string|null;state?:string|null;postalCode?:string|null}|null;
  occupancy:(Record<string,unknown>&{id:string;name?:string;occupancyType?:string|null;status?:string|null})|null;
  preplan:(Record<string,unknown>&{id:string;approvalStatus?:string|null;tacticalSummary?:string|null;hazards?:string|null|unknown[];accessNotes?:string|null;utilityNotes?:string|null})|null;
  nearbyHydrants:Hydrant[];warnings:string[]
}

export default function IncidentTacticalIntelligence({incidentId,recordVersion,lang,onApplied}:{incidentId:string;recordVersion:number;lang:string;onApplied:(version:number)=>void}){
  const [data,setData]=useState<Intelligence|null>(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')

  async function load(){
    setError('')
    try{
      const response=await fetch('/api/incidents/'+incidentId+'/intelligence',{cache:'no-store'})
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to load incident intelligence.')
      setData(body.data)
    }catch(err){setError(err instanceof Error?err.message:'Unable to load incident intelligence.')}
  }

  useEffect(()=>{void load()},[incidentId])

  async function applyContext(){
    if(!data?.occupancy&&!data?.preplan)return
    setBusy(true);setError('');setMessage('')
    try{
      const linkResponse=await fetch('/api/incidents/'+incidentId+'/intelligence',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({occupancyId:data.occupancy?.id||null,preplanId:data.preplan?.id||null})
      })
      const linkBody=await linkResponse.json()
      if(!linkResponse.ok)throw new Error(linkBody.error||'Unable to persist incident occupancy/preplan link.')

      const params=new URLSearchParams()
      if(data.occupancy?.id)params.set('occupancyId',data.occupancy.id)
      if(data.preplan?.id)params.set('preplanId',data.preplan.id)
      const candidatesResponse=await fetch('/api/incidents/'+incidentId+'/prefill?'+params.toString(),{cache:'no-store'})
      const candidateBody=await candidatesResponse.json()
      if(!candidatesResponse.ok)throw new Error(candidateBody.error||'Unable to load occupancy/preplan prefill.')
      const candidates=(candidateBody.data||[]).filter((item:any)=>!item.informational)
      if(!candidates.length){setMessage('No additional NERIS prefill values were available.');return}
      const applyResponse=await fetch('/api/incidents/'+incidentId+'/prefill',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({recordVersion,candidates})})
      const applyBody=await applyResponse.json()
      if(!applyResponse.ok)throw new Error(applyBody.error||'Unable to apply occupancy/preplan context.')
      const nextVersion=Number(applyBody.data?.incident?.recordVersion||recordVersion)
      onApplied(nextVersion)
      setMessage(String(applyBody.data?.applied||0)+' tactical context value(s) applied; '+String(applyBody.data?.skipped||0)+' skipped.')
      await load()
    }catch(err){setError(err instanceof Error?err.message:'Unable to apply tactical context.')}
    finally{setBusy(false)}
  }

  if(!data&&!error)return <Alert severity='info'>Loading responder tactical intelligence…</Alert>
  if(error&&!data)return <Alert severity='warning'>{error}</Alert>

  const hazards=Array.isArray(data?.preplan?.hazards)?data?.preplan?.hazards.join(' · '):String(data?.preplan?.hazards||'')

  return <Box sx={{display:'grid',gap:3}}>
    {error?<Alert severity='warning'>{error}</Alert>:null}
    {message?<Alert severity='success'>{message}</Alert>:null}

    <Card variant='outlined'><CardContent>
      <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'center',flexWrap:'wrap'}}>
        <Box><Typography variant='h5'>Responder Tactical Intelligence</Typography><Typography color='text.secondary'>Occupancy, preplan, hazards, access, utilities, and nearby water supply for the incident location.</Typography></Box>
        <Box sx={{display:'flex',gap:1,flexWrap:'wrap'}}><Chip variant='tonal' color={data?.source==='platform'?'success':'info'} label={data?.source==='platform'?'Forge Platform context':'Standalone context'}/><Chip variant='tonal' label={'Match: '+String(data?.matchMethod||'NONE').replaceAll('_',' ')}/></Box>
      </Box>
      {data?.address?<Typography sx={{mt:2}}>{[data.address.addressLine1,data.address.city,data.address.state,data.address.postalCode].filter(Boolean).join(', ')}</Typography>:<Alert severity='info' variant='outlined' sx={{mt:2}}>No incident address context is available yet.</Alert>}
    </CardContent></Card>

    {data?.warnings?.length?<Box sx={{display:'grid',gap:1}}>{data.warnings.map((warning,index)=><Alert key={index} severity='warning' variant='outlined'>{warning}</Alert>)}</Box>:null}

    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'1fr 1fr'},gap:3}}>
      <Card variant='outlined'><CardContent>
        <Typography variant='h5'>Matched Occupancy</Typography>
        {data?.occupancy?<Box sx={{mt:2,display:'grid',gap:1}}><Typography variant='h4'>{data.occupancy.name||data.occupancy.id}</Typography><Typography color='text.secondary'>{String(data.occupancy.occupancyType||'Occupancy type not recorded')}</Typography><Box sx={{display:'flex',gap:1,mt:1,flexWrap:'wrap'}}><Chip size='small' variant='tonal' label={String(data.occupancy.status||'Status unknown')}/><Button size='small' href={'/'+lang+'/occupancies/'+data.occupancy.id}>Open Occupancy</Button></Box></Box>:<Typography color='text.secondary' sx={{mt:2}}>No occupancy match.</Typography>}
      </CardContent></Card>

      <Card variant='outlined'><CardContent>
        <Typography variant='h5'>Preplan</Typography>
        {data?.preplan?<Box sx={{mt:2,display:'grid',gap:2}}><Box sx={{display:'flex',gap:1,alignItems:'center',flexWrap:'wrap'}}><Chip size='small' variant='tonal' color={data.preplan.approvalStatus==='APPROVED'?'success':'warning'} label={String(data.preplan.approvalStatus||'UNKNOWN')}/><Button size='small' href={'/'+lang+'/preplans/'+data.preplan.id}>Open Preplan</Button></Box>{data.preplan.tacticalSummary?<Box><Typography fontWeight={800}>Tactical Summary</Typography><Typography>{data.preplan.tacticalSummary}</Typography></Box>:null}{hazards?<Box><Typography fontWeight={800}>Hazards</Typography><Typography>{hazards}</Typography></Box>:null}{data.preplan.accessNotes?<Box><Typography fontWeight={800}>Access</Typography><Typography>{data.preplan.accessNotes}</Typography></Box>:null}{data.preplan.utilityNotes?<Box><Typography fontWeight={800}>Utilities</Typography><Typography>{data.preplan.utilityNotes}</Typography></Box>:null}</Box>:<Typography color='text.secondary' sx={{mt:2}}>No preplan available.</Typography>}
      </CardContent></Card>
    </Box>

    <Card variant='outlined'><CardContent>
      <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'center',flexWrap:'wrap',mb:2}}><Box><Typography variant='h5'>Nearby Water Supply</Typography><Typography color='text.secondary'>Hydrant intelligence uses the tenant-scoped Forge Platform hydrant domain when connected, with persistent standalone fallback.</Typography></Box><Chip variant='tonal' color='info' label={String(data?.nearbyHydrants.length||0)+' nearby'}/></Box>
      <Box sx={{display:'grid',gap:2}}>{data?.nearbyHydrants.map(h=><Box key={h.id} sx={{p:2,border:'1px solid',borderColor:'divider',borderRadius:2,display:'grid',gridTemplateColumns:{xs:'1fr',md:'1.5fr 1fr 1fr auto'},gap:2,alignItems:'center'}}><Box><Typography fontWeight={800}>{h.displayId||h.id}</Typography><Typography variant='body2'>{h.address||'Address not recorded'}</Typography></Box><Box><Typography variant='caption' color='text.secondary'>Distance</Typography><Typography>{h.distanceFeet.toLocaleString()} ft</Typography></Box><Box><Typography variant='caption' color='text.secondary'>Flow</Typography><Typography>{h.flowGpm!=null?h.flowGpm.toLocaleString()+' GPM':'Not tested'}{h.nfpaClass?' · '+h.nfpaClass:''}</Typography></Box><Box sx={{display:'flex',gap:1,alignItems:'center'}}><Chip size='small' color={['in service','in_service'].includes(String(h.status||'').toLowerCase())?'success':'warning'} variant='tonal' label={h.status||'Unknown'}/><Button size='small' href={'/'+lang+'/hydrants/'+h.id}>Open</Button></Box></Box>)}{!data?.nearbyHydrants.length?<Alert severity='info' variant='outlined'>No hydrants are within the configured 2,500-foot intelligence radius.</Alert>:null}</Box>
    </CardContent></Card>

    <Divider/>
    <Box sx={{display:'flex',justifyContent:'flex-end'}}><Button variant='contained' color='error' disabled={busy||(!data?.occupancy&&!data?.preplan)} onClick={()=>void applyContext()}>{busy?'Applying…':'Apply Occupancy & Preplan Context to NERIS'}</Button></Box>
  </Box>
}
