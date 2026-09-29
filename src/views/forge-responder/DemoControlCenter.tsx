'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

const key='forge-responder-theme-demo-events'

const actions=[
  ['New Incident','/incidents/new','tabler-siren'],
  ['New ePCR','/epcr/new','tabler-file-medical'],
  ['Flow Test','/hydrants','tabler-droplet'],
  ['Inspection','/inspections/new','tabler-clipboard-check'],
  ['Training','/training/assign','tabler-school'],
  ['Shift Trade','/scheduling/shift-trades/new','tabler-calendar-repeat'],
  ['Inventory','/inventory/transaction','tabler-arrows-exchange'],
  ['Investigation','/investigations/new','tabler-search']
]

export default function DemoControlCenter({lang}:{lang:string}) {
  const [count,setCount]=useState(0)
  const [reset,setReset]=useState(false)

  useEffect(()=>{
    try{setCount(JSON.parse(localStorage.getItem(key)||'[]').length)}catch{setCount(0)}
  },[])

  const clear=()=>{
    localStorage.removeItem(key)
    setCount(0)
    setReset(true)
  }

  return <Box sx={{display:'grid',gap:3}}>
    {reset?<Alert severity='success'>Local demo session reset. Source-backed seed data was not changed.</Alert>:null}
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
      <Card><CardContent>
        <Typography variant='h5'>Demo Session</Typography>
        <Box sx={{display:'grid',gap:2,mt:3}}>
          <Box sx={{display:'flex',justifyContent:'space-between'}}><Typography color='text.secondary'>Local actions</Typography><Typography fontWeight={800}>{count}</Typography></Box>
          <Box sx={{display:'flex',justifyContent:'space-between'}}><Typography color='text.secondary'>Source data</Typography><Chip size='small' variant='tonal' color='success' label='Read Only'/></Box>
          <Box sx={{display:'flex',justifyContent:'space-between'}}><Typography color='text.secondary'>External submission</Typography><Chip size='small' variant='tonal' color='warning' label='Disabled'/></Box>
          <Box sx={{display:'flex',justifyContent:'space-between'}}><Typography color='text.secondary'>Tenant</Typography><Typography fontWeight={700}>forge-demo</Typography></Box>
        </Box>
        <Button fullWidth variant='outlined' color='error' sx={{mt:3}} onClick={clear} startIcon={<i className='tabler-refresh'/>}>Reset Demo Session</Button>
      </CardContent></Card>

      <Card><CardContent>
        <Typography variant='h5'>Presenter Launchpad</Typography>
        <Typography color='text.secondary' sx={{mt:1,mb:3}}>Jump directly into the strongest interactive workflows.</Typography>
        <Box sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1.5}}>
          {actions.map(([label,path,icon])=><Button key={path} component={Link} href={`/${lang}${path}`} variant='tonal' color='error' startIcon={<i className={icon}/>}>{label}</Button>)}
        </Box>
      </CardContent></Card>
    </Box>
  </Box>
}
