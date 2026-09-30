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
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const [operationalStatus,setOperationalStatus]=useState('Needs Repair')
  const [notes,setNotes]=useState('')
  const [leakPresent,setLeakPresent]=useState('no')
  const [trafficHazard,setTrafficHazard]=useState('no')
  const [alternateWaterSupply,setAlternateWaterSupply]=useState('')
  const [waterProvider,setWaterProvider]=useState(String(hydrant.provider||''))
  const [workOrderReference,setWorkOrderReference]=useState('')
  const [reportedBy,setReportedBy]=useState('Demo Operator')
  const save=async()=>{
    setSaving(true);setError('')
    try{
      const response=await fetch(`/api/hydrants/${hydrant.id}/records/damage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reportedAt:new Date().toISOString(),severity,operationalStatus,leakPresent:leakPresent==='yes',trafficHazard:trafficHazard==='yes',alternateWaterSupply,waterProvider,workOrderReference,reportedBy,notes})})
      const body=await response.json(); if(!response.ok) throw new Error(body.error||'Unable to save damage report.')
      setSaved(true)
    }catch(err){setError(err instanceof Error?err.message:'Unable to save damage report.')}
    finally{setSaving(false)}
  }
  return <Card><CardContent>
    <Typography variant='h5'>Damage / Repair Intake</Typography><Typography color='text.secondary' sx={{mt:1,mb:3}}>{hydrant.displayId||hydrant.id} · {hydrant.address}</Typography>
    {saved?<Alert severity='success' sx={{mb:3}}>Damage report saved and hydrant operational status updated.</Alert>:null}{error?<Alert severity='error' sx={{mb:3}}>{error}</Alert>:null}
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
      <TextField select label='Severity' value={severity} onChange={e=>setSeverity(e.target.value)}><MenuItem value='minor'>Minor</MenuItem><MenuItem value='moderate'>Moderate</MenuItem><MenuItem value='major'>Major</MenuItem><MenuItem value='critical'>Critical / Out of Service</MenuItem></TextField>
      <TextField select label='Leak Present' value={leakPresent} onChange={e=>setLeakPresent(e.target.value)}><MenuItem value='no'>No</MenuItem><MenuItem value='yes'>Yes</MenuItem></TextField>
      <TextField select label='Traffic / Scene Hazard' value={trafficHazard} onChange={e=>setTrafficHazard(e.target.value)}><MenuItem value='no'>No</MenuItem><MenuItem value='yes'>Yes</MenuItem></TextField>
      <TextField select label='Operational Status' value={operationalStatus} onChange={e=>setOperationalStatus(e.target.value)}><MenuItem value='In Service'>In Service</MenuItem><MenuItem value='Needs Repair'>Needs Repair</MenuItem><MenuItem value='Out of Service'>Out of Service</MenuItem></TextField>
      <TextField label='Alternate Water Supply' value={alternateWaterSupply} onChange={e=>setAlternateWaterSupply(e.target.value)} placeholder='Nearest hydrant / tender / static source'/>
      <TextField label='Water Provider' value={waterProvider} onChange={e=>setWaterProvider(e.target.value)}/>
      <TextField label='Work Order / Reference' value={workOrderReference} onChange={e=>setWorkOrderReference(e.target.value)} placeholder='WO-2026-0001'/>
      <TextField label='Reported By' value={reportedBy} onChange={e=>setReportedBy(e.target.value)}/>
      <TextField multiline minRows={4} sx={{gridColumn:{md:'1 / -1'}}} label='Damage Description / Repair Notes' value={notes} onChange={e=>setNotes(e.target.value)}/>
    </Box>
    <Box sx={{display:'flex',justifyContent:'flex-end',mt:3}}><Button variant='contained' color='error' disabled={saving} onClick={()=>void save()}>{saving?'Saving...':'Submit Damage Report'}</Button></Box>
  </CardContent></Card>
}
