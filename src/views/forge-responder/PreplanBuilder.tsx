'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

const steps=['Occupancy','Access & Utilities','Hazards & Protection','Review']

type OccupancyOption={id:string;name?:string;addressLine1?:string|null;address?:string|null;recordVersion?:number}
type StationOption={id:string;name?:string;stationNumber?:string}
type Props={occupancies:OccupancyOption[];stations:StationOption[];initialOccupancyId?:string;lang:string}

export default function PreplanBuilder({occupancies,stations,initialOccupancyId,lang}:Props){
  const router=useRouter()
  const firstId=initialOccupancyId&&occupancies.some(x=>x.id===initialOccupancyId)?initialOccupancyId:occupancies[0]?.id||''
  const [step,setStep]=useState(0)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const [occupancyId,setOccupancyId]=useState(firstId)
  const [versionLabel,setVersionLabel]=useState('1')
  const [approvalStatus,setApprovalStatus]=useState('DRAFT')
  const [accessNotes,setAccessNotes]=useState('')
  const [utilityNotes,setUtilityNotes]=useState('')
  const [hazards,setHazards]=useState('')
  const [tacticalSummary,setTacticalSummary]=useState('')
  const [primaryStationId,setPrimaryStationId]=useState('')
  const selectedOccupancy=useMemo(()=>occupancies.find(x=>x.id===occupancyId),[occupancies,occupancyId])

  async function save(){
    setSaving(true);setError('')
    try{
      const payload=Object.fromEntries(Object.entries({
        occupancyId,versionLabel,approvalStatus,accessNotes,utilityNotes,hazards,tacticalSummary,primaryStationId
      }).filter(([,v])=>v!==''))
      const response=await fetch('/api/rms/preplans',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      const body=await response.json()
      if(!response.ok) throw new Error(body.error||'Unable to create preplan.')
      const selected=occupancies.find(x=>x.id===occupancyId)
      if(selected){
        await fetch(`/api/rms/occupancies/${occupancyId}`,{
          method:'PATCH',
          headers:{'Content-Type':'application/json','x-record-version':String(selected.recordVersion||1)},
          body:JSON.stringify({preplanId:body.data.id})
        })
      }
      router.push(`/${lang}/preplans/${body.data.id}`);router.refresh()
    }catch(err){setError(err instanceof Error?err.message:'Unable to create preplan.');setSaving(false)}
  }

  return <Card><CardContent>
    <Stepper activeStep={step} alternativeLabel sx={{mb:5}}>{steps.map(label=><Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
    {error?<Alert severity='error' sx={{mb:3}}>{error}</Alert>:null}
    {step===0?<Box sx={{display:'grid',gap:3}}>
      <TextField select fullWidth label='Occupancy' value={occupancyId} onChange={e=>setOccupancyId(e.target.value)}>{occupancies.map(x=><MenuItem key={x.id} value={x.id}>{x.name||x.id} — {x.addressLine1||x.address||'No address'}</MenuItem>)}</TextField>
      <TextField fullWidth label='Version Label' value={versionLabel} onChange={e=>setVersionLabel(e.target.value)}/>
      <TextField select fullWidth label='Approval Status' value={approvalStatus} onChange={e=>setApprovalStatus(e.target.value)}><MenuItem value='DRAFT'>Draft</MenuItem><MenuItem value='APPROVED'>Approved</MenuItem><MenuItem value='SUPERSEDED'>Superseded</MenuItem></TextField>
    </Box>:null}
    {step===1?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
      <TextField multiline minRows={4} label='Access Notes' value={accessNotes} onChange={e=>setAccessNotes(e.target.value)} placeholder='Primary/secondary access, gates, apparatus access, Knox Box, staging...'/>
      <TextField multiline minRows={4} label='Utility Notes' value={utilityNotes} onChange={e=>setUtilityNotes(e.target.value)} placeholder='Electric, gas, water, sprinkler riser, FDC, shutoffs...'/>
      <TextField select label='Primary Station' value={primaryStationId} onChange={e=>setPrimaryStationId(e.target.value)} sx={{gridColumn:{md:'1 / -1'}}}><MenuItem value=''>Not assigned</MenuItem>{stations.map(station=><MenuItem key={station.id} value={station.id}>{station.name||station.stationNumber||station.id}</MenuItem>)}</TextField>
    </Box>:null}
    {step===2?<Box sx={{display:'grid',gap:3}}>
      <TextField multiline minRows={4} label='Hazards' value={hazards} onChange={e=>setHazards(e.target.value)} placeholder='Special hazards, hazardous materials, collapse concerns, occupancy-specific risks...'/>
      <TextField multiline minRows={5} label='Tactical Summary' value={tacticalSummary} onChange={e=>setTacticalSummary(e.target.value)} placeholder='Initial strategy, access priorities, water supply, protection systems, command considerations...'/>
    </Box>:null}
    {step===3?<Box sx={{display:'grid',gap:2}}><Typography variant='h5'>Ready to Create Preplan</Typography><Typography color='text.secondary'>{selectedOccupancy?.name||occupancyId} · Version {versionLabel} · {approvalStatus.replaceAll('_',' ')}</Typography><Alert severity='info' variant='outlined'>Save writes through the Forge Responder data adapter: Forge Platform when connected, persistent demo storage when standalone.</Alert></Box>:null}
    <Box sx={{display:'flex',justifyContent:'space-between',gap:2,mt:5}}><Button disabled={step===0||saving} onClick={()=>setStep(v=>Math.max(0,v-1))}>Back</Button>{step<3?<Button variant='contained' color='error' disabled={!occupancyId||saving} onClick={()=>setStep(v=>Math.min(3,v+1))}>Continue</Button>:<Button variant='contained' color='error' disabled={!occupancyId||saving} onClick={()=>void save()}>{saving?'Saving...':'Create Preplan'}</Button>}</Box>
  </CardContent></Card>
}