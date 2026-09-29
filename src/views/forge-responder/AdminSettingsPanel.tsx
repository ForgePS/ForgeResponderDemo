'use client'

import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

const moduleNames=['Dashboard','Incidents','EMS / ePCR','NERIS','Prevention','Hydrants','Personnel','Training','Apparatus','Inventory','Inspections','Investigations','Reports','Maps']

export default function AdminSettingsPanel({roles}:{roles:any[]}) {
  const [modules,setModules]=useState<Record<string,boolean>>(()=>Object.fromEntries(moduleNames.map(x=>[x,true])))
  const [role,setRole]=useState(roles[0]?.name || roles[0]?.displayName || 'Administrator')
  const enabled=useMemo(()=>Object.values(modules).filter(Boolean).length,[modules])

  const save=(title:string)=>{
    const event={type:'admin-config',title,occurredAt:new Date().toISOString()}
    const key='forge-responder-theme-demo-events'
    const current=JSON.parse(localStorage.getItem(key)||'[]')
    localStorage.setItem(key,JSON.stringify([event,...current].slice(0,100)))
  }

  return <Box sx={{display:'grid',gap:3}}>
    <Card><CardContent>
      <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:2,mb:3}}>
        <div><Typography variant='h5'>Module Configuration</Typography><Typography color='text.secondary'>{enabled} modules enabled in the local demo.</Typography></div>
        <Button variant='contained' color='error' onClick={()=>save('Module configuration saved')}>Save</Button>
      </Box>
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(2,1fr)'},gap:1}}>
        {moduleNames.map(name=><FormControlLabel key={name} control={<Checkbox checked={modules[name]} onChange={e=>setModules(cur=>({...cur,[name]:e.target.checked}))}/>} label={name}/>)}
      </Box>
    </CardContent></Card>

    <Card><CardContent>
      <Typography variant='h5'>Roles & Permissions</Typography>
      <TextField select label='Role' value={role} onChange={e=>setRole(e.target.value)} sx={{mt:3,minWidth:260}}>
        {(roles.length?roles:[{name:'Administrator'},{name:'Officer'},{name:'Firefighter'}]).map((r:any,i:number)=>{const label=r.name||r.displayName||`Role ${i+1}`;return <MenuItem key={`${label}-${i}`} value={label}>{label}</MenuItem>})}
      </TextField>
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(2,1fr)'},gap:1,mt:3}}>
        {['View','Create','Edit','Approve','Manage Credentials','Perform Inspection','Run Flow Test','Manage Fleet'].map((perm,i)=><FormControlLabel key={perm} control={<Checkbox defaultChecked={i<4}/>} label={perm}/>)}
      </Box>
      <Button sx={{mt:3}} variant='tonal' onClick={()=>save(`${role} demo permissions saved`)}>Save Demo Permissions</Button>
    </CardContent></Card>

    <Card><CardContent>
      <Typography variant='h5'>Tenant Configuration</Typography>
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3,mt:3}}>
        <TextField label='Department Name' defaultValue='Forge Responder Demo Department'/>
        <TextField label='Tenant Key' defaultValue='forge-demo' disabled/>
        <TextField label='Demo City' defaultValue='Northbridge'/>
        <TextField select label='Time Zone' defaultValue='America/Chicago'><MenuItem value='America/Chicago'>America/Chicago</MenuItem><MenuItem value='America/New_York'>America/New_York</MenuItem><MenuItem value='America/Denver'>America/Denver</MenuItem><MenuItem value='America/Los_Angeles'>America/Los_Angeles</MenuItem></TextField>
        <TextField label='Incident Number Format' defaultValue='YYYY-######'/>
        <TextField select label='Default Shift' defaultValue='A Shift'><MenuItem value='A Shift'>A Shift</MenuItem><MenuItem value='B Shift'>B Shift</MenuItem><MenuItem value='C Shift'>C Shift</MenuItem></TextField>
      </Box>
      <Button sx={{mt:3}} variant='contained' color='error' onClick={()=>save('Tenant settings saved')}>Save Demo Tenant</Button>
    </CardContent></Card>
  </Box>
}
