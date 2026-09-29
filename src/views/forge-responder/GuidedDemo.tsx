'use client'

import { useState } from 'react'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

const steps=[
  {title:'Command Dashboard',path:'/dashboard',talk:'Open with the unified operational picture and readiness metrics.'},
  {title:'Hydrant GIS',path:'/maps',talk:'Show real source-backed hydrant coordinates and drill into a record.'},
  {title:'Flow Test',path:'/hydrants',talk:'Run the pressure-to-flow workflow and classification demonstration.'},
  {title:'Operational Search',path:'/search',talk:'Search one system across hydrants, personnel, apparatus, occupancies, and preplans.'},
  {title:'Prevention',path:'/prevention',talk:'Connect occupancies, inspections, preplans, and water supply.'},
  {title:'Incident Reporting',path:'/incidents/new',talk:'Walk dispatch, units, operations, and officer review.'},
  {title:'NERIS',path:'/neris',talk:'Show the 39-module schema catalog and field-level validation rules.'},
  {title:'EMS / ePCR',path:'/epcr/new',talk:'Demonstrate response through patient-care review without external submission.'},
  {title:'Personnel & Training',path:'/training',talk:'Show source-backed credentials and training assignment workflows.'},
  {title:'Administration',path:'/settings',talk:'Finish with tenant configuration, roles, permissions, and module control.'}
]

export default function GuidedDemo({lang}:{lang:string}) {
  const [index,setIndex]=useState(0)
  const step=steps[index]
  return <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'320px 1fr'},gap:3}}>
    <Card><CardContent>
      <Typography variant='h5'>Demo Sequence</Typography>
      <LinearProgress variant='determinate' value={((index+1)/steps.length)*100} color='error' sx={{my:3}}/>
      <Box sx={{display:'grid',gap:1}}>
        {steps.map((item,i)=><Button key={item.path} variant={i===index?'contained':'text'} color={i===index?'error':'inherit'} onClick={()=>setIndex(i)} sx={{justifyContent:'flex-start'}}>{i+1}. {item.title}</Button>)}
      </Box>
    </CardContent></Card>

    <Card><CardContent sx={{minHeight:360,display:'flex',flexDirection:'column'}}>
      <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:2}}>
        <div><Typography variant='overline' color='text.secondary'>Step {index+1} of {steps.length}</Typography><Typography variant='h4'>{step.title}</Typography></div>
        <Chip color='error' variant='tonal' label='Presenter Cue'/>
      </Box>
      <Typography sx={{mt:3,fontSize:'1.1rem'}}>{step.talk}</Typography>
      <Box sx={{display:'flex',gap:2,flexWrap:'wrap',mt:'auto',pt:5}}>
        <Button component={Link} href={`/${lang}${step.path}`} variant='contained' color='error' endIcon={<i className='tabler-arrow-right'/>}>Open This Screen</Button>
        <Button disabled={index===0} onClick={()=>setIndex(i=>Math.max(0,i-1))}>Previous</Button>
        <Button disabled={index===steps.length-1} onClick={()=>setIndex(i=>Math.min(steps.length-1,i+1))}>Next</Button>
      </Box>
    </CardContent></Card>
  </Box>
}
