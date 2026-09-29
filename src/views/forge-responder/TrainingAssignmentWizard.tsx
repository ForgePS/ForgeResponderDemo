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

const steps=['Course','Audience','Requirements','Review']

export default function TrainingAssignmentWizard() {
  const [step,setStep]=useState(0)
  const [saved,setSaved]=useState(false)

  const save=()=>{
    const event={type:'training-assignment',title:'Demo training assignment created',occurredAt:new Date().toISOString()}
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
        {saved ? <Alert severity='success' sx={{mb:3}}>Demo training assignment saved locally.</Alert> : null}

        {step===0 ? <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
          <TextField label='Course Title' defaultValue='SCBA Annual Refresher' />
          <TextField select label='Category' defaultValue='fire'><MenuItem value='fire'>Fire Suppression</MenuItem><MenuItem value='ems'>EMS</MenuItem><MenuItem value='hazmat'>HazMat</MenuItem><MenuItem value='driver'>Driver / Operator</MenuItem><MenuItem value='officer'>Officer Development</MenuItem></TextField>
          <TextField select label='Delivery' defaultValue='instructor'><MenuItem value='instructor'>Instructor Led</MenuItem><MenuItem value='online'>Online</MenuItem><MenuItem value='skills'>Practical Skills</MenuItem><MenuItem value='hybrid'>Hybrid</MenuItem></TextField>
          <TextField label='Estimated Hours' type='number' defaultValue='2' />
        </Box> : null}

        {step===1 ? <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
          <TextField select label='Assign To' defaultValue='all'><MenuItem value='all'>All Personnel</MenuItem><MenuItem value='a'>A Shift</MenuItem><MenuItem value='b'>B Shift</MenuItem><MenuItem value='c'>C Shift</MenuItem><MenuItem value='officers'>Officers</MenuItem><MenuItem value='paramedics'>Paramedics</MenuItem></TextField>
          <TextField select label='Station' defaultValue='all'><MenuItem value='all'>All Stations</MenuItem><MenuItem value='1'>Station 1</MenuItem><MenuItem value='2'>Station 2</MenuItem><MenuItem value='3'>Station 3</MenuItem></TextField>
          <TextField label='Due Date' type='date' InputLabelProps={{shrink:true}} />
          <TextField select label='Required' defaultValue='yes'><MenuItem value='yes'>Yes</MenuItem><MenuItem value='no'>No</MenuItem></TextField>
        </Box> : null}

        {step===2 ? <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
          <TextField label='Minimum Score' type='number' defaultValue='80' />
          <TextField select label='Practical Evaluation' defaultValue='required'><MenuItem value='required'>Required</MenuItem><MenuItem value='na'>Not Required</MenuItem></TextField>
          <TextField select label='Certificate' defaultValue='generate'><MenuItem value='generate'>Generate on Completion</MenuItem><MenuItem value='none'>No Certificate</MenuItem></TextField>
          <TextField select label='Renewal Cycle' defaultValue='annual'><MenuItem value='annual'>Annual</MenuItem><MenuItem value='biennial'>Biennial</MenuItem><MenuItem value='once'>One Time</MenuItem></TextField>
          <TextField multiline minRows={3} sx={{gridColumn:{md:'1 / -1'}}} label='Instructions' />
        </Box> : null}

        {step===3 ? <Box>
          <Typography variant='h5'>Ready to Assign</Typography>
          <Typography color='text.secondary' sx={{mt:1,mb:3}}>This demonstrates assignment and completion tracking. Source-backed certification records remain separate.</Typography>
          <Alert severity='info' variant='outlined'>The imported source does not contain standalone historical training-event records.</Alert>
        </Box> : null}

        <Box sx={{display:'flex',justifyContent:'space-between',gap:2,mt:5}}>
          <Button disabled={step===0} onClick={()=>setStep(v=>Math.max(0,v-1))}>Back</Button>
          {step<steps.length-1 ? <Button variant='contained' color='error' onClick={()=>setStep(v=>Math.min(steps.length-1,v+1))}>Continue</Button> : <Button variant='contained' color='error' onClick={save}>Assign Demo Training</Button>}
        </Box>
      </CardContent>
    </Card>
  )
}
