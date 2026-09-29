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

const steps=['Item','Movement','Control','Review']

export default function InventoryTransactionWizard() {
  const [step,setStep]=useState(0)
  const [saved,setSaved]=useState(false)
  const save=()=>{
    const event={type:'inventory-transaction',title:'Demo inventory transaction saved',occurredAt:new Date().toISOString()}
    const key='forge-responder-theme-demo-events'
    const current=JSON.parse(localStorage.getItem(key)||'[]')
    localStorage.setItem(key,JSON.stringify([event,...current].slice(0,100)))
    setSaved(true)
  }

  return <Card><CardContent>
    <Stepper activeStep={step} alternativeLabel sx={{mb:5}}>{steps.map(x=><Step key={x}><StepLabel>{x}</StepLabel></Step>)}</Stepper>
    {saved?<Alert severity='success' sx={{mb:3}}>Demo inventory transaction saved locally.</Alert>:null}
    {step===0?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
      <TextField label='Item' defaultValue='5 in Supply Hose'/><TextField select label='Category' defaultValue='hose'><MenuItem value='hose'>Hose</MenuItem><MenuItem value='ppe'>PPE</MenuItem><MenuItem value='ems'>EMS Supply</MenuItem><MenuItem value='tool'>Tool</MenuItem><MenuItem value='station'>Station Supply</MenuItem></TextField>
      <TextField label='Quantity' type='number' defaultValue='1'/><TextField select label='Unit of Measure' defaultValue='each'><MenuItem value='each'>Each</MenuItem><MenuItem value='box'>Box</MenuItem><MenuItem value='case'>Case</MenuItem><MenuItem value='feet'>Feet</MenuItem></TextField>
    </Box>:null}
    {step===1?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
      <TextField select label='Transaction' defaultValue='issue'><MenuItem value='issue'>Issue</MenuItem><MenuItem value='receive'>Receive</MenuItem><MenuItem value='transfer'>Transfer</MenuItem><MenuItem value='adjustment'>Adjustment</MenuItem><MenuItem value='retire'>Retire</MenuItem></TextField>
      <TextField label='From Location' defaultValue='Station 1 Supply'/><TextField label='To Location' defaultValue='Engine 101'/><TextField label='Requested By' defaultValue='Demo Firefighter'/>
    </Box>:null}
    {step===2?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
      <TextField label='Lot / Serial'/><TextField label='Expiration' type='date' InputLabelProps={{shrink:true}}/><TextField label='Minimum Stock' type='number' defaultValue='2'/><TextField select label='Restock Required' defaultValue='no'><MenuItem value='no'>No</MenuItem><MenuItem value='yes'>Yes</MenuItem></TextField>
      <TextField multiline minRows={3} sx={{gridColumn:{md:'1 / -1'}}} label='Notes'/>
    </Box>:null}
    {step===3?<Box><Typography variant='h5'>Ready to Post</Typography><Typography color='text.secondary' sx={{mt:1,mb:3}}>The transaction will be recorded in the browser-local demo activity stream only.</Typography><Alert severity='info' variant='outlined'>No source inventory history was present in the imported export.</Alert></Box>:null}
    <Box sx={{display:'flex',justifyContent:'space-between',gap:2,mt:5}}>
      <Button disabled={step===0} onClick={()=>setStep(v=>Math.max(0,v-1))}>Back</Button>
      {step<3?<Button variant='contained' color='error' onClick={()=>setStep(v=>v+1)}>Continue</Button>:<Button variant='contained' color='error' onClick={save}>Save Demo Transaction</Button>}
    </Box>
  </CardContent></Card>
}
