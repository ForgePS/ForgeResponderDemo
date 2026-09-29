'use client'

import { useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

const steps=['Request','Coverage','Approval']

export default function ShiftTradeWizard({personnel}:{personnel:any[]}) {
  const [step,setStep]=useState(0)
  const [requester,setRequester]=useState(personnel[0]?.id||'')
  const [cover,setCover]=useState(personnel[1]?.id||personnel[0]?.id||'')
  const [saved,setSaved]=useState(false)
  const requesterRow=useMemo(()=>personnel.find(p=>p.id===requester),[personnel,requester])
  const coverRow=useMemo(()=>personnel.find(p=>p.id===cover),[personnel,cover])
  const sameEms=Boolean(requesterRow?.ems && coverRow?.ems && requesterRow.ems===coverRow.ems)
  const sameRank=Boolean(requesterRow?.rank && coverRow?.rank && requesterRow.rank===coverRow.rank)

  const save=()=>{
    const event={type:'shift-trade-request',title:'Demo shift trade submitted',detail:`${requesterRow?.displayName||'Requester'} → ${coverRow?.displayName||'Coverage'}`,occurredAt:new Date().toISOString()}
    const key='forge-responder-theme-demo-events'
    const current=JSON.parse(localStorage.getItem(key)||'[]')
    localStorage.setItem(key,JSON.stringify([event,...current].slice(0,100)))
    setSaved(true)
  }

  return <Card><CardContent>
    <Stepper activeStep={step} alternativeLabel sx={{mb:5}}>{steps.map(x=><Step key={x}><StepLabel>{x}</StepLabel></Step>)}</Stepper>
    {saved?<Alert severity='success' sx={{mb:3}}>Demo shift trade request saved locally.</Alert>:null}

    {step===0?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
      <TextField select label='Requester' value={requester} onChange={e=>setRequester(e.target.value)}>{personnel.map(p=><MenuItem key={p.id} value={p.id}>{p.displayName} · {p.rank} · {p.shift}</MenuItem>)}</TextField>
      <TextField label='Shift Date' type='date' InputLabelProps={{shrink:true}}/>
      <TextField select label='Requested Shift' defaultValue={requesterRow?.shift||'A Shift'}><MenuItem value='A Shift'>A Shift</MenuItem><MenuItem value='B Shift'>B Shift</MenuItem><MenuItem value='C Shift'>C Shift</MenuItem></TextField>
      <TextField label='Reason' placeholder='Optional reason'/>
      <TextField multiline minRows={3} sx={{gridColumn:{md:'1 / -1'}}} label='Notes'/>
    </Box>:null}

    {step===1?<Box sx={{display:'grid',gap:3}}>
      <TextField select label='Coverage Member' value={cover} onChange={e=>setCover(e.target.value)}>{personnel.filter(p=>p.id!==requester).map(p=><MenuItem key={p.id} value={p.id}>{p.displayName} · {p.rank} · {p.shift}</MenuItem>)}</TextField>
      <Box sx={{display:'flex',gap:1,flexWrap:'wrap'}}>
        <Chip variant='tonal' color={sameRank?'success':'warning'} label={sameRank?'Rank Match':'Rank Review Needed'}/>
        <Chip variant='tonal' color={sameEms?'success':'warning'} label={sameEms?'EMS Match':'EMS Credential Review'}/>
        <Chip variant='tonal' color={coverRow?.status==='Active'?'success':'warning'} label={coverRow?.status||'Status Unknown'}/>
      </Box>
      <Alert severity={sameRank && sameEms ? 'success' : 'warning'} variant='outlined'>
        Qualification checks are presentation logic for the trade-show workflow. Officer approval remains required.
      </Alert>
    </Box>:null}

    {step===2?<Box>
      <Typography variant='h5'>Approval Review</Typography>
      <Typography color='text.secondary' sx={{mt:1,mb:3}}>Confirm the requested date, coverage member, qualification checks, and approval routing.</Typography>
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:2}}>
        <div><Typography variant='caption' color='text.secondary'>Requester</Typography><Typography fontWeight={700}>{requesterRow?.displayName||'—'}</Typography></div>
        <div><Typography variant='caption' color='text.secondary'>Coverage</Typography><Typography fontWeight={700}>{coverRow?.displayName||'—'}</Typography></div>
        <div><Typography variant='caption' color='text.secondary'>Requester Rank</Typography><Typography>{requesterRow?.rank||'—'}</Typography></div>
        <div><Typography variant='caption' color='text.secondary'>Coverage Rank</Typography><Typography>{coverRow?.rank||'—'}</Typography></div>
      </Box>
      <Alert severity='info' variant='outlined' sx={{mt:3}}>Submitting here creates only a browser-local demonstration event. It does not alter source scheduling data.</Alert>
    </Box>:null}

    <Box sx={{display:'flex',justifyContent:'space-between',gap:2,mt:5}}>
      <Button disabled={step===0} onClick={()=>setStep(v=>Math.max(0,v-1))}>Back</Button>
      {step<2?<Button variant='contained' color='error' onClick={()=>setStep(v=>v+1)}>Continue</Button>:<Button variant='contained' color='error' onClick={save}>Submit Demo Trade</Button>}
    </Box>
  </CardContent></Card>
}
