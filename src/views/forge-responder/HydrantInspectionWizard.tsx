'use client'

import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

const checklist=['Visible and accessible','Caps present and secure','Nozzle threads serviceable','Operating nut serviceable','No visible leaks','Valve accessible','Hydrant body condition acceptable','No obstruction within working area','Identification / marking visible']

export default function HydrantInspectionWizard({hydrant}:{hydrant:any}) {
  const [checks,setChecks]=useState<Record<string,boolean>>(()=>Object.fromEntries(checklist.map(x=>[x,true])))
  const [saved,setSaved]=useState(false)
  const issues=Object.values(checks).filter(v=>!v).length
  const save=()=>{
    const event={type:'hydrant-inspection',title:`Hydrant inspection: ${hydrant.displayId||hydrant.id}`,detail:`${issues} checklist issues`,occurredAt:new Date().toISOString()}
    const key='forge-responder-theme-demo-events'
    const current=JSON.parse(localStorage.getItem(key)||'[]')
    localStorage.setItem(key,JSON.stringify([event,...current].slice(0,100)))
    setSaved(true)
  }
  return <Card><CardContent>
    <Typography variant='h5'>Inspection Checklist</Typography><Typography color='text.secondary' sx={{mt:1,mb:3}}>{hydrant.displayId||hydrant.id} · {hydrant.address}</Typography>
    {saved?<Alert severity='success' sx={{mb:3}}>Demo hydrant inspection saved locally.</Alert>:null}
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:1}}>
      {checklist.map(item=><FormControlLabel key={item} control={<Checkbox checked={checks[item]} onChange={e=>setChecks(cur=>({...cur,[item]:e.target.checked}))}/>} label={item}/>)}
    </Box>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3,mt:3}}>
      <TextField select label='Operational Status' defaultValue={hydrant.status||'In Service'}><MenuItem value='In Service'>In Service</MenuItem><MenuItem value='Needs Repair'>Needs Repair</MenuItem><MenuItem value='Out of Service'>Out of Service</MenuItem></TextField>
      <TextField label='Inspector' defaultValue='Demo Inspector'/>
      <TextField multiline minRows={4} sx={{gridColumn:{md:'1 / -1'}}} label='Inspection Notes'/>
    </Box>
    <Alert severity={issues?'warning':'success'} sx={{mt:3}}>{issues ? `${issues} checklist item(s) require attention.` : 'All checklist items currently marked acceptable.'}</Alert>
    <Box sx={{display:'flex',justifyContent:'flex-end',mt:3}}><Button variant='contained' color='error' onClick={save}>Save Demo Inspection</Button></Box>
  </CardContent></Card>
}
