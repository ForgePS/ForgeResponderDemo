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

export default function TrainingCompletionPanel({personnel}:{personnel:any[]}) {
  const [saved,setSaved]=useState(false)

  const save=()=>{
    const event={type:'training-completion',title:'Demo training completion recorded',occurredAt:new Date().toISOString()}
    const key='forge-responder-theme-demo-events'
    const current=JSON.parse(localStorage.getItem(key)||'[]')
    localStorage.setItem(key,JSON.stringify([event,...current].slice(0,100)))
    setSaved(true)
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h5'>Record Completion</Typography>
        <Typography color='text.secondary' sx={{mt:1,mb:3}}>Instructor completion entry with score, skills evaluation, and verification.</Typography>
        {saved ? <Alert severity='success' sx={{mb:3}}>Demo completion saved locally.</Alert> : null}
        <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
          <TextField select label='Personnel' defaultValue={personnel[0]?.id || ''}>{personnel.map(x=><MenuItem key={x.id} value={x.id}>{x.displayName}</MenuItem>)}</TextField>
          <TextField select label='Course' defaultValue='scba'><MenuItem value='scba'>SCBA Annual Refresher</MenuItem><MenuItem value='driver'>Driver Training</MenuItem><MenuItem value='ems'>EMS Continuing Education</MenuItem></TextField>
          <TextField label='Completion Date' type='date' InputLabelProps={{shrink:true}} />
          <TextField label='Score' placeholder='95%' />
          <TextField select label='Skills Evaluation' defaultValue='pass'><MenuItem value='pass'>Pass</MenuItem><MenuItem value='remediation'>Needs Remediation</MenuItem><MenuItem value='na'>N/A</MenuItem></TextField>
          <TextField label='Instructor' defaultValue='Demo Instructor' />
        </Box>
        <Box sx={{display:'flex',justifyContent:'flex-end',mt:4}}><Button variant='contained' color='error' onClick={save}>Record Demo Completion</Button></Box>
      </CardContent>
    </Card>
  )
}
