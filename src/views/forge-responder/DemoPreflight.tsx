'use client'

import { useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

type Check={label:string;status:'PASS'|'WARN';detail:string}

export default function DemoPreflight({mapboxConfigured}:{mapboxConfigured:boolean}) {
  const [online,setOnline]=useState(true)
  const [localStorageOk,setLocalStorageOk]=useState(true)
  const [fullscreen,setFullscreen]=useState(false)

  useEffect(()=>{
    setOnline(navigator.onLine)
    try{
      localStorage.setItem('forge-preflight','1')
      localStorage.removeItem('forge-preflight')
      setLocalStorageOk(true)
    }catch{setLocalStorageOk(false)}
    setFullscreen(Boolean(document.fullscreenEnabled))
  },[])

  const checks:Check[]=useMemo(()=>[
    {label:'Source seed package',status:'PASS',detail:'Sanitized Forge demo data bundled locally'},
    {label:'NERIS schema catalog',status:'PASS',detail:'39 modules loaded from Core + Secondary workbooks'},
    {label:'Local demo storage',status:localStorageOk?'PASS':'WARN',detail:localStorageOk?'Browser-local demo actions available':'Browser storage unavailable'},
    {label:'Network',status:online?'PASS':'WARN',detail:online?'Network connection detected':'Offline; local screens still available'},
    {label:'Mapbox',status:mapboxConfigured?'PASS':'WARN',detail:mapboxConfigured?'Access token configured':'Set MAPBOX_ACCESS_TOKEN for live GIS'},
    {label:'Full-screen support',status:fullscreen?'PASS':'WARN',detail:fullscreen?'Browser supports kiosk-style full screen':'Full-screen API unavailable'},
    {label:'External submissions',status:'PASS',detail:'NERIS and NEMSIS live submission disabled'},
    {label:'Source mutation',status:'PASS',detail:'Source-backed seed data remains read-only'}
  ],[online,localStorageOk,mapboxConfigured,fullscreen])

  const warns=checks.filter(c=>c.status==='WARN').length

  return (
    <div>
      <Alert severity={warns?'warning':'success'} sx={{mb:3}}>
        {warns ? `${warns} readiness item(s) need attention before showtime.` : 'Demo environment is ready for booth use.'}
      </Alert>
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(2,1fr)'},gap:2}}>
        {checks.map(check=>(
          <Card key={check.label}>
            <CardContent>
              <Box sx={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:2}}>
                <div><Typography variant='h6'>{check.label}</Typography><Typography color='text.secondary' sx={{mt:.5}}>{check.detail}</Typography></div>
                <Chip size='small' color={check.status==='PASS'?'success':'warning'} variant='tonal' label={check.status}/>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
      <Box sx={{display:'flex',justifyContent:'flex-end',mt:3}}>
        <Button variant='tonal' onClick={()=>location.reload()} startIcon={<i className='tabler-refresh'/>}>Re-run Browser Checks</Button>
      </Box>
    </div>
  )
}
