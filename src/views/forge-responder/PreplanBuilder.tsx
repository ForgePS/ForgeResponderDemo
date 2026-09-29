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

const steps=['Occupancy','Access & Utilities','Hazards & Protection','Review']

export default function PreplanBuilder({occupancies}:{occupancies:any[]}) {
  const [step,setStep]=useState(0)
  const [saved,setSaved]=useState(false)

  const save=()=>{
    const event={type:'preplan-save',title:'Demo preplan saved',occurredAt:new Date().toISOString()}
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

        {saved ? <Alert severity='success' sx={{mb:3}}>Demo preplan saved locally in this browser. Source records were not modified.</Alert> : null}

        {step===0 ? <Box sx={{display:'grid',gap:3}}>
          <TextField select fullWidth label='Occupancy' defaultValue={occupancies[0]?.id || ''}>{occupancies.map(x=><MenuItem key={x.id} value={x.id}>{x.name} — {x.address}</MenuItem>)}</TextField>
          <TextField fullWidth label='Preplan Title' defaultValue='Responder Preplan' />
          <TextField select fullWidth label='Plan Status' defaultValue='draft'><MenuItem value='draft'>Draft</MenuItem><MenuItem value='review'>Ready for Review</MenuItem></TextField>
        </Box> : null}

        {step===1 ? <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
          <TextField label='Primary Access' placeholder='Front / Alpha side' />
          <TextField label='Knox Box' placeholder='Location' />
          <TextField label='Electric Shutoff' placeholder='Location' />
          <TextField label='Gas Shutoff' placeholder='Location' />
          <TextField multiline minRows={3} sx={{gridColumn:{md:'1 / -1'}}} label='Access Notes' placeholder='Gates, apparatus access, restricted areas...' />
        </Box> : null}

        {step===2 ? <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
          <TextField label='Construction' placeholder='Type / features' />
          <TextField label='Occupancy Use' placeholder='Primary use' />
          <TextField label='Fire Protection' placeholder='Sprinkler, standpipe, alarm...' />
          <TextField label='FDC Location' placeholder='Location' />
          <TextField multiline minRows={4} sx={{gridColumn:{md:'1 / -1'}}} label='Special Hazards & Tactical Notes' />
        </Box> : null}

        {step===3 ? <Box>
          <Typography variant='h5'>Ready for Demo Save</Typography>
          <Typography color='text.secondary' sx={{mt:1}}>This workflow demonstrates plan authoring, review, and publish readiness. No source record or external system will be changed.</Typography>
        </Box> : null}

        <Box sx={{display:'flex',justifyContent:'space-between',gap:2,mt:5}}>
          <Button disabled={step===0} onClick={()=>setStep(v=>Math.max(0,v-1))}>Back</Button>
          {step<steps.length-1 ? <Button variant='contained' color='error' onClick={()=>setStep(v=>Math.min(steps.length-1,v+1))}>Continue</Button> : <Button variant='contained' color='error' onClick={save}>Save Demo Preplan</Button>}
        </Box>
      </CardContent>
    </Card>
  )
}
