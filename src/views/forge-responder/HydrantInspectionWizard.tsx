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
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const [operationalStatus,setOperationalStatus]=useState(hydrant.status||'In Service')
  const [inspector,setInspector]=useState('Demo Inspector')
  const [notes,setNotes]=useState('')
  const issues=Object.values(checks).filter(v=>!v).length
  const save=async()=>{
    setSaving(true);setError('')
    try{
      const response=await fetch(`/api/hydrants/${hydrant.id}/records/inspections`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({inspectionDate:new Date().toISOString(),operationalStatus,inspector,notes,checklist:checks,issueCount:issues})})
      const body=await response.json(); if(!response.ok) throw new Error(body.error||'Unable to save inspection.')
      setSaved(true)
    }catch(err){setError(err instanceof Error?err.message:'Unable to save inspection.')}
    finally{setSaving(false)}
  }
  return <Card><CardContent>
    <Typography variant='h5'>Inspection Checklist</Typography><Typography color='text.secondary' sx={{mt:1,mb:3}}>{hydrant.displayId||hydrant.id} · {hydrant.address}</Typography>
    {saved?<Alert severity='success' sx={{mb:3}}>Hydrant inspection saved and operational status updated.</Alert>:null}{error?<Alert severity='error' sx={{mb:3}}>{error}</Alert>:null}
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:1}}>
      {checklist.map(item=><FormControlLabel key={item} control={<Checkbox checked={checks[item]} onChange={e=>setChecks(cur=>({...cur,[item]:e.target.checked}))}/>} label={item}/>)}
    </Box>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3,mt:3}}>
      <TextField select label='Operational Status' value={operationalStatus} onChange={e=>setOperationalStatus(e.target.value)}><MenuItem value='In Service'>In Service</MenuItem><MenuItem value='Needs Repair'>Needs Repair</MenuItem><MenuItem value='Out of Service'>Out of Service</MenuItem></TextField>
      <TextField label='Inspector' value={inspector} onChange={e=>setInspector(e.target.value)}/>
      <TextField multiline minRows={4} sx={{gridColumn:{md:'1 / -1'}}} label='Inspection Notes' value={notes} onChange={e=>setNotes(e.target.value)}/>
    </Box>
    <Alert severity={issues?'warning':'success'} sx={{mt:3}}>{issues ? `${issues} checklist item(s) require attention.` : 'All checklist items currently marked acceptable.'}</Alert>
    <Box sx={{display:'flex',justifyContent:'flex-end',mt:3}}><Button variant='contained' color='error' disabled={saving} onClick={()=>void save()}>{saving?'Saving...':'Save Inspection'}</Button></Box>
  </CardContent></Card>
}
