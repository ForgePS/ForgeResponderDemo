'use client'

import { useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

type Option={id:string;name?:string;addressLine1?:string;versionLabel?:string}
type Candidate={fieldKey:string;sectionKey:string;value:unknown;prefillSource:string;target?:'FIELD'|'INCIDENT'|'UNIT_ASSIGNMENT'|'PERSONNEL_ASSIGNMENT'|'CONTEXT';informational?:boolean;label?:string;sourceMessageId?:string|null;sourceEventId?:string|null}

function targetLabel(candidate:Candidate){
  const target=candidate.target||'FIELD'
  if(target==='INCIDENT')return 'Incident'
  if(target==='UNIT_ASSIGNMENT')return 'Unit Assignment'
  if(target==='PERSONNEL_ASSIGNMENT')return 'Personnel Assignment'
  if(target==='CONTEXT')return 'Context'
  return 'NERIS Field'
}

function targetColor(candidate:Candidate):'default'|'primary'|'success'|'warning'|'info'{
  const target=candidate.target||'FIELD'
  if(target==='INCIDENT')return 'primary'
  if(target==='UNIT_ASSIGNMENT'||target==='PERSONNEL_ASSIGNMENT')return 'success'
  if(target==='CONTEXT')return 'info'
  return 'default'
}

function displayValue(candidate:Candidate){
  if(candidate.target==='UNIT_ASSIGNMENT'&&candidate.value&&typeof candidate.value==='object'){
    const value=candidate.value as Record<string,unknown>
    return [value.sourceUnitCallsign||value.sourceUnitId,value.dispatchedAt?'Dispatched '+new Date(String(value.dispatchedAt)).toLocaleTimeString():null].filter(Boolean).join(' · ')
  }
  if(candidate.target==='PERSONNEL_ASSIGNMENT'&&candidate.value&&typeof candidate.value==='object'){
    const value=candidate.value as Record<string,unknown>
    return [value.role,value.personnelId].filter(Boolean).join(' · ')
  }
  if(candidate.value&&typeof candidate.value==='object'){
    try{return JSON.stringify(candidate.value)}catch{return String(candidate.value)}
  }
  return String(candidate.value)
}

export default function IncidentPrefillAssistant({incidentId,recordVersion,occupancies,preplans,onApplied}:{incidentId:string;recordVersion:number;occupancies:Option[];preplans:Option[];onApplied:(version:number,applied:number,skipped:number)=>void}){
  const [occupancyId,setOccupancyId]=useState('')
  const [preplanId,setPreplanId]=useState('')
  const [candidates,setCandidates]=useState<Candidate[]>([])
  const [selected,setSelected]=useState<Record<string,boolean>>({})
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')

  const selectedCandidates=useMemo(()=>candidates.filter((candidate,index)=>selected[String(index)]&&!candidate.informational),[candidates,selected])

  async function load(){
    setBusy(true);setError('')
    try{
      const params=new URLSearchParams()
      if(occupancyId)params.set('occupancyId',occupancyId)
      if(preplanId)params.set('preplanId',preplanId)
      const response=await fetch('/api/incidents/'+incidentId+'/prefill?'+params.toString(),{cache:'no-store'})
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to load prefill suggestions.')
      const next:Candidate[]=body.data||[]
      setCandidates(next)
      setSelected(Object.fromEntries(next.map((candidate,index)=>[String(index),!candidate.informational])))
    }catch(err){setError(err instanceof Error?err.message:'Unable to load prefill suggestions.')}
    finally{setBusy(false)}
  }

  useEffect(()=>{void load()},[incidentId])

  async function apply(){
    setBusy(true);setError('');setMessage('')
    try{
      const response=await fetch('/api/incidents/'+incidentId+'/prefill',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({recordVersion,candidates:selectedCandidates})
      })
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to apply prefill suggestions.')
      const version=Number(body.data?.incident?.recordVersion||recordVersion)
      const applied=Number(body.data?.applied||0)
      const skipped=Number(body.data?.skipped||0)
      onApplied(version,applied,skipped)
      setMessage(applied+' applied · '+skipped+' skipped')
      await load()
    }catch(err){setError(err instanceof Error?err.message:'Unable to apply prefill suggestions.')}
    finally{setBusy(false)}
  }

  return <Box sx={{display:'grid',gap:3}}>
    {error?<Alert severity='error'>{error}</Alert>:null}
    {message?<Alert severity='success'>{message}</Alert>:null}

    <Card variant='outlined'><CardContent>
      <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'center',flexWrap:'wrap'}}>
        <Box><Typography variant='h5'>Prefill & Auto-Dispatch Assist</Typography><Typography color='text.secondary'>Review department, occupancy, preplan, and normalized CAD suggestions before Forge writes fields or creates resource assignments.</Typography></Box>
        <Chip variant='tonal' color='info' label='Officer confirmation required'/>
      </Box>
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr auto'},gap:2,mt:3}}>
        <TextField select label='Occupancy Context' value={occupancyId} onChange={e=>setOccupancyId(e.target.value)}>
          <MenuItem value=''>No occupancy selected</MenuItem>
          {occupancies.map(row=><MenuItem key={row.id} value={row.id}>{row.name||row.addressLine1||row.id}</MenuItem>)}
        </TextField>
        <TextField select label='Preplan Context' value={preplanId} onChange={e=>setPreplanId(e.target.value)}>
          <MenuItem value=''>No preplan selected</MenuItem>
          {preplans.map(row=><MenuItem key={row.id} value={row.id}>{row.name||row.versionLabel||row.id}</MenuItem>)}
        </TextField>
        <Button variant='outlined' disabled={busy} onClick={()=>void load()}>Refresh</Button>
      </Box>
    </CardContent></Card>

    <Card variant='outlined'><CardContent>
      <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:2,mb:2}}>
        <Typography variant='h5'>Suggested Values</Typography>
        <Chip variant='tonal' label={String(selectedCandidates.length)+' selected'}/>
      </Box>
      <Box sx={{display:'grid',gap:2}}>
        {candidates.map((candidate,index)=><Box key={candidate.fieldKey+'-'+index} sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'auto 1fr auto'},gap:2,alignItems:'center',p:2,border:'1px solid',borderColor:'divider',borderRadius:2}}>
          <Box>{candidate.informational?<Chip size='small' variant='tonal' color='info' label='Context only'/>:<FormControlLabel control={<Checkbox checked={Boolean(selected[String(index)])} onChange={e=>setSelected(current=>({...current,[String(index)]:e.target.checked}))}/>} label='Include'/>}</Box>
          <Box>
            <Typography fontWeight={800}>{candidate.label||candidate.fieldKey.replaceAll('_',' ')}</Typography>
            <Typography>{displayValue(candidate)}</Typography>
            <Box sx={{display:'flex',gap:1,alignItems:'center',flexWrap:'wrap',mt:.5}}><Chip size='small' variant='outlined' color={targetColor(candidate)} label={targetLabel(candidate)}/><Typography variant='caption' color='text.secondary'>{candidate.sectionKey.replaceAll('_',' ')} · {candidate.prefillSource.replaceAll('_',' ')}{candidate.sourceMessageId?' · '+candidate.sourceMessageId:''}</Typography></Box>
          </Box>
          <Chip size='small' variant='tonal' color={candidate.prefillSource==='CAD'?'error':candidate.prefillSource==='OCCUPANCY'||candidate.prefillSource==='PREPLAN'?'success':'default'} label={candidate.prefillSource.replaceAll('_',' ')}/>
        </Box>)}
        {!candidates.length?<Alert severity='info' variant='outlined'>No prefill suggestions are currently available.</Alert>:null}
      </Box>
      <Alert severity='warning' variant='outlined' sx={{mt:3}}>NERIS prefill values remain unconfirmed until reviewed or edited by an officer. Unit/personnel suggestions create normal incident assignments only when a valid CAD-to-Forge mapping exists.</Alert>
      <Box sx={{display:'flex',justifyContent:'flex-end',mt:3}}><Button variant='contained' color='error' disabled={busy||!selectedCandidates.length} onClick={()=>void apply()}>Apply Selected Suggestions</Button></Box>
    </CardContent></Card>
  </Box>
}
