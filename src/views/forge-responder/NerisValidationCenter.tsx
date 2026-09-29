'use client'

import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import { nerisModules } from '@/utils/nerisSchema'

const domains=[
  ['Dispatch','PASS','Incident number, alarm date, response mode'],
  ['Civic Location','PASS','Address and jurisdiction fields'],
  ['Location Use','PASS','Property use classification'],
  ['Unit Response','REVIEW','Staffing snapshot and response mode review'],
  ['Tactic Timestamps','PASS','Operational timestamp structure'],
  ['Incident','PASS','Core incident fields'],
  ['Fire','PASS','Fire secondary-module structure']
]

export default function NerisValidationCenter() {
  const [ran,setRan]=useState(false)
  const [progress,setProgress]=useState(0)

  const run=()=>{
    setRan(false)
    setProgress(20)
    setTimeout(()=>setProgress(60),150)
    setTimeout(()=>{
      setProgress(100)
      setRan(true)
      const event={type:'neris-validation',title:'NERIS demo validation completed',occurredAt:new Date().toISOString()}
      const key='forge-responder-theme-demo-events'
      const current=JSON.parse(localStorage.getItem(key)||'[]')
      localStorage.setItem(key,JSON.stringify([event,...current].slice(0,100)))
    },300)
  }

  const pass=domains.filter(x=>x[1]==='PASS').length
  const schemaModuleCount=nerisModules.length

  return (
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'1.25fr .75fr'},gap:3}}>
      <Card>
        <CardContent>
          <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:2,flexWrap:'wrap'}}>
            <div><Typography variant='h5'>Validation Center</Typography><Typography color='text.secondary'>Demo mapping and completeness checks.</Typography></div>
            <Chip color={ran?'success':'default'} variant='tonal' label={ran?'Validation Complete':'Ready for Review'}/>
          </Box>
          {progress>0 ? <LinearProgress variant='determinate' value={progress} color='error' sx={{my:3}}/> : null}
          <Box sx={{display:'grid',gap:1.5,mt:3}}>
            {domains.map(([name,status,detail])=>(
              <Box key={name} sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:2,p:2,border:'1px solid',borderColor:'divider',borderRadius:2}}>
                <div><Typography fontWeight={700}>{name}</Typography><Typography variant='caption' color='text.secondary'>{detail}</Typography></div>
                <Chip size='small' variant='tonal' color={status==='PASS'?'success':'warning'} label={status}/>
              </Box>
            ))}
          </Box>
          <Button onClick={run} variant='contained' color='error' sx={{mt:3}} startIcon={<i className='tabler-scan'/>}>Run Demo Validation</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant='h5'>Submission Boundary</Typography>
          <Typography color='text.secondary' sx={{mt:1,mb:3}}>Standalone trade-show behavior.</Typography>
          <Box sx={{display:'grid',gap:2}}>
            <Box><Typography variant='caption' color='text.secondary'>Mapped domains</Typography><Typography variant='h4'>{schemaModuleCount}</Typography></Box>
            <Box><Typography variant='caption' color='text.secondary'>Passing checks</Typography><Typography variant='h4'>{pass}</Typography></Box>
            <Box><Typography variant='caption' color='text.secondary'>Live NERIS endpoint</Typography><Typography fontWeight={700}>Not configured</Typography></Box>
            <Box><Typography variant='caption' color='text.secondary'>External submission</Typography><Typography fontWeight={700}>Disabled</Typography></Box>
          </Box>
          <Alert severity='info' variant='outlined' sx={{mt:3}}>Validation is local to the demo UI. No record is transmitted externally.</Alert>
        </CardContent>
      </Card>
    </Box>
  )
}
