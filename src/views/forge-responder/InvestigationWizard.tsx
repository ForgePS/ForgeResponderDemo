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

const steps=['Case Intake','Scene','Evidence','Review']

export default function InvestigationWizard() {
  const [step,setStep]=useState(0)
  const [saved,setSaved]=useState(false)
  const save=()=>{
    const event={type:'investigation-case',title:'Demo investigation case opened',occurredAt:new Date().toISOString()}
    const key='forge-responder-theme-demo-events'
    const current=JSON.parse(localStorage.getItem(key)||'[]')
    localStorage.setItem(key,JSON.stringify([event,...current].slice(0,100)))
    setSaved(true)
  }

  return <Card><CardContent>
    <Stepper activeStep={step} alternativeLabel sx={{mb:5}}>{steps.map(x=><Step key={x}><StepLabel>{x}</StepLabel></Step>)}</Stepper>
    {saved?<Alert severity='success' sx={{mb:3}}>Demo investigation case opened locally.</Alert>:null}
    {step===0?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
      <TextField label='Case Number' defaultValue='INV-2026-0001'/><TextField label='Incident Number' defaultValue='2026-000001'/>
      <TextField select label='Case Type' defaultValue='fire'><MenuItem value='fire'>Fire Investigation</MenuItem><MenuItem value='origin'>Origin & Cause</MenuItem><MenuItem value='code'>Code Enforcement Referral</MenuItem><MenuItem value='admin'>Administrative Review</MenuItem></TextField>
      <TextField label='Lead Investigator' defaultValue='Demo Investigator'/>
    </Box>:null}
    {step===1?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
      <TextField sx={{gridColumn:{md:'1 / -1'}}} label='Location' defaultValue='100 Demo Avenue, Northbridge'/>
      <TextField select label='Scene Status' defaultValue='secured'><MenuItem value='secured'>Secured</MenuItem><MenuItem value='released'>Released</MenuItem><MenuItem value='restricted'>Restricted</MenuItem></TextField>
      <TextField label='Weather' defaultValue='Clear / 72°F'/>
      <TextField multiline minRows={4} sx={{gridColumn:{md:'1 / -1'}}} label='Initial Observations'/>
    </Box>:null}
    {step===2?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
      <TextField select label='Evidence Type' defaultValue='photo'><MenuItem value='photo'>Photo</MenuItem><MenuItem value='physical'>Physical Item</MenuItem><MenuItem value='document'>Document</MenuItem><MenuItem value='interview'>Interview</MenuItem><MenuItem value='video'>Video</MenuItem></TextField>
      <TextField label='Tag Number' defaultValue='EV-001'/><TextField label='Custodian' defaultValue='Demo Investigator'/><TextField label='Storage Location' defaultValue='Evidence Locker A'/>
      <TextField multiline minRows={4} sx={{gridColumn:{md:'1 / -1'}}} label='Evidence / Chain-of-Custody Notes'/>
    </Box>:null}
    {step===3?<Box><Typography variant='h5'>Open Case</Typography><Typography color='text.secondary' sx={{mt:1,mb:3}}>Review scene, evidence, assignment, and case status before creating the browser-local demonstration.</Typography><Alert severity='info' variant='outlined'>No source-backed investigation history was present in the export.</Alert></Box>:null}
    <Box sx={{display:'flex',justifyContent:'space-between',gap:2,mt:5}}>
      <Button disabled={step===0} onClick={()=>setStep(v=>Math.max(0,v-1))}>Back</Button>
      {step<3?<Button variant='contained' color='error' onClick={()=>setStep(v=>v+1)}>Continue</Button>:<Button variant='contained' color='error' onClick={save}>Open Demo Case</Button>}
    </Box>
  </CardContent></Card>
}
