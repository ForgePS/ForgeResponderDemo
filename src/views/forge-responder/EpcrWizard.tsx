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

const steps=['Response','Patient','Assessment','Care & Disposition','Review']

export default function EpcrWizard({apparatus}:{apparatus:any[]}) {
  const [step,setStep]=useState(0)
  const [saved,setSaved]=useState(false)

  const save=()=>{
    const event={type:'epcr-complete',title:'Demo ePCR completed',occurredAt:new Date().toISOString()}
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
        {saved ? <Alert severity='success' sx={{mb:3}}>Demo ePCR saved locally. No NEMSIS or external transmission occurred.</Alert> : null}

        {step===0 ? <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
          <TextField select label='Unit' defaultValue={apparatus[0]?.id || ''}>{apparatus.slice(0,12).map(x=><MenuItem key={x.id} value={x.id}>{x.unitNumber || x.name || x.id}</MenuItem>)}</TextField>
          <TextField select label='Response Type' defaultValue='911'><MenuItem value='911'>911 Response</MenuItem><MenuItem value='mutual'>Mutual Aid</MenuItem><MenuItem value='standby'>Standby</MenuItem></TextField>
          <TextField label='Dispatch Time' type='time' InputLabelProps={{shrink:true}} />
          <TextField label='Arrival Time' type='time' InputLabelProps={{shrink:true}} />
          <TextField label='Scene Address' sx={{gridColumn:{md:'1 / -1'}}} placeholder='100 Demo Avenue, Northbridge' />
        </Box> : null}

        {step===1 ? <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
          <TextField label='Age' type='number' />
          <TextField select label='Sex' defaultValue='unknown'><MenuItem value='female'>Female</MenuItem><MenuItem value='male'>Male</MenuItem><MenuItem value='unknown'>Unknown</MenuItem></TextField>
          <TextField label='Chief Complaint' />
          <TextField select label='Acuity' defaultValue='urgent'><MenuItem value='emergent'>Emergent</MenuItem><MenuItem value='urgent'>Urgent</MenuItem><MenuItem value='nonurgent'>Non-Urgent</MenuItem></TextField>
          <TextField multiline minRows={3} sx={{gridColumn:{md:'1 / -1'}}} label='History / Medications / Allergies' />
        </Box> : null}

        {step===2 ? <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(3,1fr)'},gap:3}}>
          <TextField label='Blood Pressure' placeholder='120/80' />
          <TextField label='Heart Rate' placeholder='82' />
          <TextField label='Respiratory Rate' placeholder='16' />
          <TextField label='SpO₂' placeholder='98%' />
          <TextField label='GCS' placeholder='15' />
          <TextField label='Glucose' placeholder='110 mg/dL' />
        </Box> : null}

        {step===3 ? <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
          <TextField label='Primary Impression' />
          <TextField select label='Disposition' defaultValue='transported'><MenuItem value='transported'>Transported</MenuItem><MenuItem value='refused'>Refused Care</MenuItem><MenuItem value='assist'>Assist Only</MenuItem><MenuItem value='cancelled'>Cancelled</MenuItem></TextField>
          <TextField label='Destination' />
          <TextField select label='Transport Mode' defaultValue='nonemergency'><MenuItem value='emergency'>Emergency</MenuItem><MenuItem value='nonemergency'>Non-Emergency</MenuItem></TextField>
          <TextField multiline minRows={4} sx={{gridColumn:{md:'1 / -1'}}} label='Narrative' placeholder='Assessment, treatment, response, and disposition...' />
        </Box> : null}

        {step===4 ? <Box>
          <Typography variant='h5'>Clinical Review</Typography>
          <Typography color='text.secondary' sx={{mt:1,mb:3}}>Review required fields, care, disposition, and narrative before saving the local demo record.</Typography>
          <Alert severity='info' variant='outlined'>NEMSIS export and external transmission are intentionally disabled in this standalone trade-show environment.</Alert>
        </Box> : null}

        <Box sx={{display:'flex',justifyContent:'space-between',gap:2,mt:5}}>
          <Button disabled={step===0} onClick={()=>setStep(v=>Math.max(0,v-1))}>Back</Button>
          {step<steps.length-1 ? <Button variant='contained' color='error' onClick={()=>setStep(v=>Math.min(steps.length-1,v+1))}>Continue</Button> : <Button variant='contained' color='error' onClick={save}>Save Demo ePCR</Button>}
        </Box>
      </CardContent>
    </Card>
  )
}
