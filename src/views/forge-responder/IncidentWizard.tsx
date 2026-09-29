'use client'

import { useState } from 'react'
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

const steps=['Dispatch','Units & Personnel','Operations','Review']

export default function IncidentWizard({apparatus,personnel}:{apparatus:any[];personnel:any[]}) {
  const [step,setStep]=useState(0)
  const [saved,setSaved]=useState(false)

  const save=()=>{
    const event={type:'incident-create',title:'Demo incident created',occurredAt:new Date().toISOString()}
    const key='forge-responder-theme-demo-events'
    const current=JSON.parse(localStorage.getItem(key)||'[]')
    localStorage.setItem(key,JSON.stringify([event,...current].slice(0,100)))
    setSaved(true)
  }

  return (
    <Card>
      <CardContent>
        <Stepper activeStep={step} alternativeLabel sx={{mb:5}}>
          {steps.map(label=><Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>

        {saved ? <Alert severity='success' sx={{mb:3}}>Demo incident saved locally. No official incident or external submission was created.</Alert> : null}

        {step===0 ? <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
          <TextField label='Incident Number' defaultValue='2026-000001' />
          <TextField select label='Incident Type' defaultValue='structure'><MenuItem value='structure'>Structure Fire</MenuItem><MenuItem value='alarm'>Alarm</MenuItem><MenuItem value='vehicle'>Vehicle Fire</MenuItem><MenuItem value='hazard'>Hazardous Condition</MenuItem><MenuItem value='service'>Service Call</MenuItem></TextField>
          <TextField label='Dispatch Time' type='time' InputLabelProps={{shrink:true}} />
          <TextField label='Address' placeholder='100 Demo Avenue, Northbridge' />
          <TextField label='Cross Street / Location Notes' sx={{gridColumn:{md:'1 / -1'}}} />
        </Box> : null}

        {step===1 ? <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
          <TextField select label='Primary Unit' defaultValue={apparatus[0]?.id || ''}>{apparatus.slice(0,12).map(x=><MenuItem key={x.id} value={x.id}>{x.unitNumber || x.name || x.id}</MenuItem>)}</TextField>
          <TextField select label='Officer' defaultValue={personnel[0]?.id || ''}>{personnel.slice(0,25).map(x=><MenuItem key={x.id} value={x.id}>{x.displayName || x.name || x.id}</MenuItem>)}</TextField>
          <TextField select label='Alarm Assignment' defaultValue='first'><MenuItem value='first'>First Alarm</MenuItem><MenuItem value='working'>Working Fire</MenuItem><MenuItem value='mutual'>Mutual Aid</MenuItem></TextField>
          <TextField label='Staffing Snapshot' defaultValue='4 personnel' />
        </Box> : null}

        {step===2 ? <Box sx={{display:'grid',gap:3}}>
          <TextField select label='Operational Mode' defaultValue='investigating'><MenuItem value='investigating'>Investigating</MenuItem><MenuItem value='offensive'>Offensive</MenuItem><MenuItem value='defensive'>Defensive</MenuItem><MenuItem value='standby'>Standby</MenuItem></TextField>
          <TextField multiline minRows={4} label='Command / Tactical Notes' placeholder='Initial actions, assignments, water supply, search, ventilation, fire control...' />
          <TextField multiline minRows={3} label='Narrative Notes' placeholder='Key observations and operational milestones...' />
        </Box> : null}

        {step===3 ? <Box>
          <Typography variant='h5'>Officer Review</Typography>
          <Typography color='text.secondary' sx={{mt:1,mb:3}}>Review dispatch, unit assignment, staffing, operations, and narrative before saving the browser-local demo incident.</Typography>
          <Alert severity='info' variant='outlined'>This standalone trade-show workflow does not write to a production RMS, CAD, NERIS endpoint, or external agency.</Alert>
        </Box> : null}

        <Box sx={{display:'flex',justifyContent:'space-between',gap:2,mt:5}}>
          <Button disabled={step===0} onClick={()=>setStep(v=>Math.max(0,v-1))}>Back</Button>
          {step<steps.length-1 ? <Button variant='contained' color='error' onClick={()=>setStep(v=>Math.min(steps.length-1,v+1))}>Continue</Button> : <Button variant='contained' color='error' onClick={save}>Save Demo Incident</Button>}
        </Box>
      </CardContent>
    </Card>
  )
}
