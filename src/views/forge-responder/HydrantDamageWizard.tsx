'use client'

import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

export default function HydrantDamageWizard({hydrant}:{hydrant:any}) {
  const [severity,setSeverity]=useState('moderate')
  const [saved,setSaved]=useState(false)
  const save=()=>{
    const event={type:'hydrant-damage',title:`Hydrant damage report: ${hydrant.displayId||hydrant.id}`,detail:`Severity: ${severity}`,occurredAt:new Date().toISOString()}
    const key='forge-responder-theme-demo-events'
    const current=JSON.parse(localStorage.getItem(key)||'[]')
    localStorage.setItem(key,JSON.stringify([event,...current].slice(0,100)))
    setSaved(true)
  }
  return <Card><CardContent>
    <Typography variant='h5'>Damage / Repair Intake</Typography><Typography color='text.secondary' sx={{mt:1,mb:3}}>{hydrant.displayId||hydrant.id} · {hydrant.address}</Typography>
    {saved?<Alert severity='success' sx={{mb:3}}>Demo damage report saved locally.</Alert>:null}
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
      <TextField select label='Severity' value={severity} onChange={e=>setSeverity(e.target.value)}><MenuItem value='minor'>Minor</MenuItem><MenuItem value='moderate'>Moderate</MenuItem><MenuItem value='major'>Major</MenuItem><MenuItem value='critical'>Critical / Out of Service</MenuItem></TextField>
      <TextField select label='Leak Present' defaultValue='no'><MenuItem value='no'>No</MenuItem><MenuItem value='yes'>Yes</MenuItem></TextField>
      <TextField select label='Traffic / Scene Hazard' defaultValue='no'><MenuItem value='no'>No</MenuItem><MenuItem value='yes'>Yes</MenuItem></TextField>
      <TextField select label='Operational Status' defaultValue='Needs Repair'><MenuItem value='In Service'>In Service</MenuItem><MenuItem value='Needs Repair'>Needs Repair</MenuItem><MenuItem value='Out of Service'>Out of Service</MenuItem></TextField>
      <TextField label='Alternate Water Supply' placeholder='Nearest hydrant / tender / static source'/>
      <TextField label='Water Provider' defaultValue={hydrant.provider||''}/>
      <TextField label='Work Order / Reference' placeholder='WO-2026-0001'/>
      <TextField label='Reported By' defaultValue='Demo Operator'/>
      <TextField multiline minRows={4} sx={{gridColumn:{md:'1 / -1'}}} label='Damage Description / Repair Notes'/>
    </Box>
    <Box sx={{display:'flex',justifyContent:'flex-end',mt:3}}><Button variant='contained' color='error' onClick={save}>Submit Demo Damage Report</Button></Box>
  </CardContent></Card>
}
