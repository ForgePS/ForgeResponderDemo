'use client'

import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

type CadStatus={
  links:Array<{id:string;cadConnectionId:string;sourceIncidentId:string;sourceIncidentNumber:string|null;linkStatus:string;linkMethod:string;recordVersion:number;updatedAt:string}>
  openConflicts:Array<{id:string;conflictType:string;status:string;severity:string;fieldIdentifier:string|null;resolutionReason:string|null;recordVersion:number;createdAt:string}>
  operatingHints:{linked:boolean;conflictCount:number}
}

export default function CadIncidentPanel({incidentId}:{incidentId:string}){
  const [status,setStatus]=useState<CadStatus|null>(null)
  const [source,setSource]=useState<'platform'|'demo'>('demo')
  const [error,setError]=useState('')

  useEffect(()=>{
    void fetch('/api/incidents/'+incidentId+'/cad-status',{cache:'no-store'})
      .then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error||'Unable to load CAD status.');setStatus(body.data);setSource(body.source)})
      .catch(err=>setError(err instanceof Error?err.message:'Unable to load CAD status.'))
  },[incidentId])

  if(error)return <Alert severity='error'>{error}</Alert>
  if(!status)return <Alert severity='info'>Loading CAD incident status…</Alert>

  return <Box sx={{display:'grid',gap:3}}>
    <Card variant='outlined'><CardContent>
      <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'center',flexWrap:'wrap'}}>
        <Box><Typography variant='h5'>CAD Incident Link</Typography><Typography color='text.secondary'>Connection state between this RMS incident and the CAD source record.</Typography></Box>
        <Chip variant='tonal' color={status.operatingHints.linked?'success':'warning'} label={status.operatingHints.linked?'CAD Linked':source==='demo'?'Standalone Demo':'Not Linked'}/>
      </Box>
      <Box sx={{display:'grid',gap:2,mt:3}}>
        {status.links.map(link=><Box key={link.id} sx={{p:2,border:'1px solid',borderColor:'divider',borderRadius:2}}>
          <Typography fontWeight={800}>{link.sourceIncidentNumber||link.sourceIncidentId}</Typography>
          <Typography variant='body2'>{'Status: '+link.linkStatus+' · Method: '+link.linkMethod}</Typography>
          <Typography variant='caption' color='text.secondary'>{'Updated '+new Date(link.updatedAt).toLocaleString()}</Typography>
        </Box>)}
        {!status.links.length?<Alert severity='info' variant='outlined'>No CAD link is associated with this incident.</Alert>:null}
      </Box>
    </CardContent></Card>

    <Card variant='outlined'><CardContent>
      <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'center',mb:2}}>
        <Typography variant='h5'>CAD Conflicts</Typography>
        <Chip variant='tonal' color={status.openConflicts.length?'error':'success'} label={String(status.openConflicts.length)+' open'}/>
      </Box>
      <Box sx={{display:'grid',gap:2}}>
        {status.openConflicts.map(conflict=><Alert key={conflict.id} severity={conflict.severity==='HIGH'||conflict.severity==='CRITICAL'?'error':'warning'} variant='outlined'>
          <Typography fontWeight={800}>{conflict.conflictType.replaceAll('_',' ')}</Typography>
          <Typography variant='body2'>{(conflict.fieldIdentifier?'Field: '+conflict.fieldIdentifier+' · ':'')+conflict.status}</Typography>
        </Alert>)}
        {!status.openConflicts.length?<Alert severity='success' variant='outlined'>No open CAD conflicts for this incident.</Alert>:null}
      </Box>
    </CardContent></Card>
  </Box>
}
