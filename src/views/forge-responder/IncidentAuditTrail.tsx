'use client'

import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

type Event={id:string;action:string;resourceType:string;result:string;riskLevel?:string|null;actorType?:string|null;actorUserId?:string|null;occurredAt:string;metadataJson?:unknown}

function pretty(value:string){return value.replaceAll('_',' ').replaceAll('.',' ').replace(/\b\w/g,m=>m.toUpperCase())}

export default function IncidentAuditTrail({incidentId}:{incidentId:string}){
  const [events,setEvents]=useState<Event[]>([])
  const [source,setSource]=useState<'platform'|'demo'>('demo')
  const [error,setError]=useState('')

  useEffect(()=>{
    void fetch('/api/incidents/'+incidentId+'/audit',{cache:'no-store'})
      .then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error||'Unable to load audit trail.');setEvents(body.data||[]);setSource(body.source)})
      .catch(err=>setError(err instanceof Error?err.message:'Unable to load audit trail.'))
  },[incidentId])

  if(error)return <Alert severity='warning'>{error}</Alert>

  return <Card variant='outlined'><CardContent>
    <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'center',flexWrap:'wrap',mb:3}}>
      <Box><Typography variant='h5'>Incident Audit Trail</Typography><Typography color='text.secondary'>System and user activity associated with this incident.</Typography></Box>
      <Chip variant='tonal' color={source==='platform'?'success':'info'} label={source==='platform'?'Forge Platform audit':'Standalone activity log'}/>
    </Box>
    <Box sx={{display:'grid',gap:2}}>
      {events.map(event=><Box key={event.id} sx={{p:2,border:'1px solid',borderColor:'divider',borderRadius:2}}>
        <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:2,flexWrap:'wrap'}}>
          <Box><Typography fontWeight={800}>{pretty(event.action)}</Typography><Typography variant='body2' color='text.secondary'>{event.actorType?pretty(event.actorType):'System'}{event.actorUserId?' · '+event.actorUserId:''}</Typography></Box>
          <Box sx={{display:'flex',gap:1}}>{event.riskLevel?<Chip size='small' variant='tonal' label={event.riskLevel}/>:null}<Chip size='small' variant='tonal' color={event.result==='SUCCESS'?'success':'warning'} label={event.result}/></Box>
        </Box>
        <Typography variant='caption' color='text.secondary' display='block' sx={{mt:1}}>{new Date(event.occurredAt).toLocaleString()}</Typography>
        {event.metadataJson?<Box component='pre' sx={{whiteSpace:'pre-wrap',wordBreak:'break-word',fontSize:12,mt:2,p:1.5,bgcolor:'action.hover',borderRadius:1,m:0}}>{JSON.stringify(event.metadataJson,null,2)}</Box>:null}
      </Box>)}
      {!events.length?<Alert severity='info' variant='outlined'>No incident audit events are available yet.</Alert>:null}
    </Box>
  </CardContent></Card>
}
