'use client'

import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

type CadStatus={
  links:Array<{id:string;cadConnectionId:string;sourceIncidentId:string;sourceIncidentNumber:string|null;linkStatus:string;linkMethod:string;recordVersion:number;updatedAt:string}>
  openConflicts:Array<{id:string;conflictType:string;status:string;severity:string;fieldIdentifier:string|null;resolutionReason:string|null;recordVersion:number;createdAt:string}>
  fieldProvenance:Array<{id:string;fieldIdentifier:string;currentValueSource:string;sourceSystem:string;cadConnectionId:string|null;cadRawMessageId:string|null;cadNormalizedEventId:string|null;appliedAt:string;manualOverrideAt:string|null;manualOverrideReason:string|null;ownershipPolicy:string;recordVersion:number;updatedAt:string}>
  operatingHints:{linked:boolean;conflictCount:number;cadOwnedFieldCount?:number;manualOverrideCount?:number}
}

type Connection={id:string;name:string;vendor:string;status:string}
const actions=['USE_CAD','KEEP_FORGE','MERGE','LINK','UNLINK','CREATE_NEW','IGNORE','ESCALATE','CORRECT_MAPPING']

export default function CadIncidentPanel({incidentId,lang}:{incidentId:string;lang:string}){
  const [status,setStatus]=useState<CadStatus|null>(null)
  const [source,setSource]=useState<'platform'|'demo'>('demo')
  const [connections,setConnections]=useState<Connection[]>([])
  const [connectionId,setConnectionId]=useState('')
  const [sourceIncidentId,setSourceIncidentId]=useState('')
  const [sourceIncidentNumber,setSourceIncidentNumber]=useState('')
  const [reason,setReason]=useState('Manual CAD linkage reviewed in Forge Responder')
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const [busy,setBusy]=useState(false)

  async function load(){
    setError('')
    try{
      const [statusResponse,connectionsResponse]=await Promise.all([
        fetch('/api/incidents/'+incidentId+'/cad-status',{cache:'no-store'}),
        fetch('/api/cad/connections',{cache:'no-store'})
      ])
      const statusBody=await statusResponse.json()
      const connectionsBody=await connectionsResponse.json()
      if(!statusResponse.ok)throw new Error(statusBody.error||'Unable to load CAD status.')
      if(!connectionsResponse.ok)throw new Error(connectionsBody.error||'Unable to load CAD connections.')
      setStatus(statusBody.data)
      setSource(statusBody.source)
      setConnections(connectionsBody.data||[])
      if(!connectionId&&(connectionsBody.data||[])[0]?.id)setConnectionId((connectionsBody.data||[])[0].id)
    }catch(err){setError(err instanceof Error?err.message:'Unable to load CAD status.')}
  }

  useEffect(()=>{void load()},[incidentId])

  async function link(){
    if(!connectionId||!sourceIncidentId.trim())return
    setBusy(true);setError('');setMessage('')
    try{
      const response=await fetch('/api/incidents/'+incidentId+'/cad-link',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({cadConnectionId:connectionId,sourceIncidentId:sourceIncidentId.trim(),sourceIncidentNumber:sourceIncidentNumber.trim()||null,reason})
      })
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to link CAD incident.')
      setSourceIncidentId('');setSourceIncidentNumber('');await load();setMessage('CAD incident linked.')
    }catch(err){setError(err instanceof Error?err.message:'Unable to link CAD incident.')}
    finally{setBusy(false)}
  }

  async function unlink(link:{id:string;recordVersion:number}){
    setBusy(true);setError('');setMessage('')
    try{
      const response=await fetch('/api/incidents/'+incidentId+'/cad-link',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'UNLINK',cadIncidentLinkId:link.id,recordVersion:link.recordVersion,reason})
      })
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to unlink CAD incident.')
      await load();setMessage('CAD incident unlinked.')
    }catch(err){setError(err instanceof Error?err.message:'Unable to unlink CAD incident.')}
    finally{setBusy(false)}
  }

  async function resolve(conflict:CadStatus['openConflicts'][number],resolutionAction:string){
    setBusy(true);setError('');setMessage('')
    try{
      const response=await fetch('/api/cad/conflicts/'+conflict.id+'/resolve',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({resolutionAction,resolutionReason:reason,recordVersion:conflict.recordVersion})
      })
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to resolve CAD conflict.')
      await load();setMessage('CAD conflict updated.')
    }catch(err){setError(err instanceof Error?err.message:'Unable to resolve CAD conflict.')}
    finally{setBusy(false)}
  }

  if(error&&!status)return <Alert severity='error'>{error}</Alert>
  if(!status)return <Alert severity='info'>Loading CAD incident status…</Alert>

  return <Box sx={{display:'grid',gap:3}}>
    {error?<Alert severity='error'>{error}</Alert>:null}
    {message?<Alert severity='success'>{message}</Alert>:null}

    <Card variant='outlined'><CardContent>
      <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'center',flexWrap:'wrap'}}>
        <Box><Typography variant='h5'>CAD Incident Link</Typography><Typography color='text.secondary'>Connection state between this RMS incident and the CAD source record.</Typography></Box>
        <Chip variant='tonal' color={status.operatingHints.linked?'success':'warning'} label={status.operatingHints.linked?'CAD Linked':source==='demo'?'Standalone Demo':'Not Linked'}/>
      </Box>

      <TextField fullWidth label='Link / Conflict Reason' value={reason} onChange={e=>setReason(e.target.value)} sx={{mt:3}}/>

      <Box sx={{display:'grid',gap:2,mt:3}}>
        {status.links.map(link=><Box key={link.id} sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'center',flexWrap:'wrap',p:2,border:'1px solid',borderColor:'divider',borderRadius:2}}>
          <Box>
            <Typography fontWeight={800}>{link.sourceIncidentNumber||link.sourceIncidentId}</Typography>
            <Typography variant='body2'>{'Status: '+link.linkStatus+' · Method: '+link.linkMethod}</Typography>
            <Typography variant='caption' color='text.secondary'>{'Updated '+new Date(link.updatedAt).toLocaleString()}</Typography>
          </Box>
          <Button color='warning' variant='outlined' disabled={busy} onClick={()=>void unlink(link)}>Unlink</Button>
        </Box>)}
        {!status.links.length?<Alert severity='info' variant='outlined'>No CAD link is associated with this incident.</Alert>:null}
      </Box>

      {!status.operatingHints.linked?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(3,1fr)'},gap:2,mt:3}}>
        <TextField select label='CAD Connection' value={connectionId} onChange={e=>setConnectionId(e.target.value)}>
          {connections.map(row=><MenuItem key={row.id} value={row.id}>{row.name} — {row.vendor}</MenuItem>)}
        </TextField>
        <TextField label='Source Incident ID' value={sourceIncidentId} onChange={e=>setSourceIncidentId(e.target.value)}/>
        <TextField label='Source Incident Number' value={sourceIncidentNumber} onChange={e=>setSourceIncidentNumber(e.target.value)}/>
        <Box sx={{gridColumn:{md:'1 / -1'},display:'flex',justifyContent:'flex-end'}}><Button variant='contained' color='error' disabled={busy||!connectionId||!sourceIncidentId.trim()} onClick={()=>void link()}>Link CAD Incident</Button></Box>
      </Box>:null}
    </CardContent></Card>

    <Card variant='outlined'><CardContent>
      <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'center',flexWrap:'wrap',mb:2}}>
        <Box><Typography variant='h5'>CAD Field Ownership</Typography><Typography color='text.secondary'>Tracks fields applied from CAD and fields later overridden by an officer.</Typography></Box>
        <Box sx={{display:'flex',gap:1,flexWrap:'wrap'}}>
          <Chip variant='tonal' color='info' label={String(status.operatingHints.cadOwnedFieldCount??status.fieldProvenance.filter(row=>row.currentValueSource==='CAD'&&!row.manualOverrideAt).length)+' CAD owned'}/>
          <Chip variant='tonal' color='warning' label={String(status.operatingHints.manualOverrideCount??status.fieldProvenance.filter(row=>Boolean(row.manualOverrideAt)).length)+' overridden'}/>
        </Box>
      </Box>
      <Box sx={{display:'grid',gap:2}}>
        {status.fieldProvenance.map(row=><Box key={row.id} sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'center',flexWrap:'wrap',p:2,border:'1px solid',borderColor:'divider',borderRadius:2}}>
          <Box>
            <Typography fontWeight={800}>{row.fieldIdentifier.replaceAll('_',' ')}</Typography>
            <Typography variant='body2'>{row.ownershipPolicy.replaceAll('_',' ')} · Source: {row.currentValueSource}</Typography>
            <Typography variant='caption' color='text.secondary'>{row.manualOverrideAt?'Overridden '+new Date(row.manualOverrideAt).toLocaleString():'Applied '+new Date(row.appliedAt).toLocaleString()}</Typography>
            {row.manualOverrideReason?<Typography variant='caption' color='text.secondary' display='block'>{row.manualOverrideReason}</Typography>:null}
          </Box>
          <Chip size='small' variant='tonal' color={row.manualOverrideAt?'warning':row.currentValueSource==='CAD'?'info':'default'} label={row.manualOverrideAt?'Officer Override':row.currentValueSource==='CAD'?'CAD':'Forge'}/>
        </Box>)}
        {!status.fieldProvenance.length?<Alert severity='info' variant='outlined'>No CAD-applied field provenance has been recorded for this incident.</Alert>:null}
      </Box>
    </CardContent></Card>

    <Card variant='outlined'><CardContent>
      <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'center',mb:2}}>
        <Typography variant='h5'>CAD Conflicts</Typography>
        <Chip variant='tonal' color={status.openConflicts.length?'error':'success'} label={String(status.openConflicts.length)+' open'}/>
      </Box>
      <Box sx={{display:'grid',gap:2}}>
        {status.openConflicts.map(conflict=><Box key={conflict.id} sx={{p:2,border:'1px solid',borderColor:'divider',borderRadius:2}}>
          <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'center',flexWrap:'wrap'}}>
            <Box>
              <Typography fontWeight={800}>{conflict.conflictType.replaceAll('_',' ')}</Typography>
              <Typography variant='body2'>{(conflict.fieldIdentifier?'Field: '+conflict.fieldIdentifier+' · ':'')+conflict.status}</Typography>
            </Box>
            <Chip size='small' variant='tonal' color={conflict.severity==='HIGH'||conflict.severity==='CRITICAL'?'error':'warning'} label={conflict.severity}/>
          </Box>
          <Box sx={{display:'flex',gap:1,flexWrap:'wrap',mt:2}}>
            {actions.map(action=><Button key={action} size='small' disabled={busy} variant={action==='ESCALATE'?'outlined':'tonal'} color={action==='ESCALATE'?'warning':'primary'} onClick={()=>void resolve(conflict,action)}>{action.replaceAll('_',' ')}</Button>)}
          </Box>
        </Box>)}
        {!status.openConflicts.length?<Alert severity='success' variant='outlined'>No open CAD conflicts for this incident.</Alert>:null}
      </Box>
    </CardContent></Card>

    <Box sx={{display:'flex',justifyContent:'flex-end'}}>
      <Button href={`/${lang}/cad`} variant='outlined'>Open CAD Operations</Button>
    </Box>
  </Box>
}
