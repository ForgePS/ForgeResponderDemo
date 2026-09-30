'use client'

import { useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

type Kind='exposures'|'civilian-casualties'|'fire-service-casualties'|'hazmat-substances'|'hazmat-containers'|'alarm-systems'|'protection-systems'|'attachments'

const kinds:Array<{kind:Kind;label:string;important?:boolean}>=[
  {kind:'exposures',label:'Exposures'},
  {kind:'civilian-casualties',label:'Civilian Casualties',important:true},
  {kind:'fire-service-casualties',label:'Fire Service Casualties',important:true},
  {kind:'hazmat-substances',label:'Hazmat Substances',important:true},
  {kind:'hazmat-containers',label:'Hazmat Containers'},
  {kind:'alarm-systems',label:'Alarm Systems'},
  {kind:'protection-systems',label:'Protection Systems'},
  {kind:'attachments',label:'Attachments'}
]

export default function SpecialtyReviewSummary({incidentId}:{incidentId:string}){
  const [counts,setCounts]=useState<Record<string,number>>({})
  const [error,setError]=useState('')

  useEffect(()=>{
    void Promise.all(kinds.map(async item=>{
      const response=await fetch(`/api/incidents/${incidentId}/specialty/${item.kind}`,{cache:'no-store'})
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||`Unable to load ${item.label}.`)
      const active=(body.data||[]).filter((row:Record<string,unknown>)=>String(row.status||'ACTIVE')!=='ARCHIVED').length
      return [item.kind,active] as const
    }))
      .then(entries=>setCounts(Object.fromEntries(entries)))
      .catch(err=>setError(err instanceof Error?err.message:'Unable to load specialty review summary.'))
  },[incidentId])

  if(error)return <Alert severity='warning' variant='outlined'>{error}</Alert>

  const total=Object.values(counts).reduce((sum,value)=>sum+value,0)

  return <Box sx={{display:'grid',gap:2}}>
    <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:2,flexWrap:'wrap'}}>
      <Box>
        <Typography variant='h5'>Specialty Record Review</Typography>
        <Typography color='text.secondary'>Incident-linked repeatable records available to the reviewing officer.</Typography>
      </Box>
      <Chip variant='tonal' label={`${total} total records`}/>
    </Box>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',lg:'repeat(4,1fr)'},gap:2}}>
      {kinds.map(item=><Box key={item.kind} sx={{p:2,border:'1px solid',borderColor:'divider',borderRadius:2}}>
        <Typography variant='caption' color='text.secondary'>{item.label}</Typography>
        <Typography variant='h5'>{counts[item.kind]??'—'}</Typography>
      </Box>)}
    </Box>
  </Box>
}
