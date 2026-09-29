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

const reportOptions=['Hydrant Readiness','Personnel Certification Status','Apparatus Readiness','Occupancy / Prevention Summary','Inspection Program Summary','Activity Summary','Audit Log','NERIS Schema Coverage']

export default function ReportBuilder() {
  const [report,setReport]=useState(reportOptions[0])
  const [period,setPeriod]=useState('Current Month')
  const [generated,setGenerated]=useState(false)

  const generate=()=>{
    setGenerated(true)
    const event={type:'report-generate',title:`Demo report generated: ${report}`,occurredAt:new Date().toISOString()}
    const key='forge-responder-theme-demo-events'
    const current=JSON.parse(localStorage.getItem(key)||'[]')
    localStorage.setItem(key,JSON.stringify([event,...current].slice(0,100)))
  }

  const exportDemo=(format:string)=>{
    const event={type:'report-export',title:`Demo ${format} export prepared`,occurredAt:new Date().toISOString()}
    const key='forge-responder-theme-demo-events'
    const current=JSON.parse(localStorage.getItem(key)||'[]')
    localStorage.setItem(key,JSON.stringify([event,...current].slice(0,100)))
  }

  return <Card><CardContent>
    <Typography variant='h5'>Report Builder</Typography>
    <Typography color='text.secondary' sx={{mt:1,mb:3}}>Build a source-backed operational report preview.</Typography>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(2,1fr)'},gap:3}}>
      <TextField select label='Report' value={report} onChange={e=>setReport(e.target.value)}>{reportOptions.map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField>
      <TextField select label='Period' value={period} onChange={e=>setPeriod(e.target.value)}><MenuItem value='Current Shift'>Current Shift</MenuItem><MenuItem value='Current Week'>Current Week</MenuItem><MenuItem value='Current Month'>Current Month</MenuItem><MenuItem value='Current Year'>Current Year</MenuItem><MenuItem value='All Demo Data'>All Demo Data</MenuItem></TextField>
      <TextField select label='Group By' defaultValue='none'><MenuItem value='none'>None</MenuItem><MenuItem value='station'>Station</MenuItem><MenuItem value='shift'>Shift</MenuItem><MenuItem value='district'>District</MenuItem><MenuItem value='status'>Status</MenuItem></TextField>
      <TextField select label='Format' defaultValue='screen'><MenuItem value='screen'>On-Screen Preview</MenuItem><MenuItem value='pdf'>PDF</MenuItem><MenuItem value='csv'>CSV</MenuItem></TextField>
    </Box>
    <Box sx={{display:'flex',gap:2,flexWrap:'wrap',mt:4}}>
      <Button variant='contained' color='error' onClick={generate}>Generate Demo Report</Button>
      <Button variant='tonal' onClick={()=>exportDemo('PDF')}>Export PDF</Button>
      <Button variant='tonal' onClick={()=>exportDemo('CSV')}>Export CSV</Button>
      <Button variant='outlined' onClick={()=>exportDemo('Email')}>Email Report</Button>
    </Box>
    {generated?<Alert severity='success' sx={{mt:3}}>Preview generated: {report} · {period}. Export actions are simulation-only in this standalone demo.</Alert>:null}
  </CardContent></Card>
}
