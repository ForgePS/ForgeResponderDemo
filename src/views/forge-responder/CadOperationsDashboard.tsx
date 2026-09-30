'use client'

import { useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

type Connection={id:string;name:string;vendor:string;adapterKey:string;adapterVersion:string;environment:string;transportType:string;status:string;intakeMode:string;healthStatus:string;recordVersion:number;lastMessageAt?:string|null;lastSuccessAt?:string|null;lastErrorSummary?:string|null}
type Summary={connections:Connection[];messages:{received:number;applied:number;duplicates:number;failed:number;deadLetter:number;requiresReview:number;byStatus:Record<string,number>};openConflicts:number;unmappedValues:number;unknownUnits:number;unknownPersonnel:number;activeLinks:number}
type Conflict={id:string;incidentId:string|null;conflictType:string;status:string;severity:string;fieldIdentifier:string|null;resolutionReason:string|null;recordVersion:number;createdAt:string}
type Unmapped={id:string;category:string;sourceField:string;sourceValue:string;occurrenceCount:number;status:string;recordVersion:number;lastSeenAt:string}
type UnknownUnit={id:string;sourceUnitId:string;sourceUnitCallsign:string|null;occurrenceCount:number;status:string;recordVersion:number;lastSeenAt:string}
type UnknownPerson={id:string;sourcePersonnelId:string;sourceName:string|null;occurrenceCount:number;status:string;recordVersion:number;lastSeenAt:string}
type Message={id:string;receivedAt:string;transportType:string;sourceMessageId:string|null;sourceIncidentId:string|null;processingStatus:string;authenticationStatus:string;payloadSizeBytes:number|null;payloadHash:string|null;correlationId:string|null;cadConnectionId:string}
type Option={id:string;callSign?:string;unitNumber?:string;name?:string;personId?:string;displayName?:string}

const resolutionActions=['USE_CAD','KEEP_FORGE','MERGE','LINK','UNLINK','CREATE_NEW','IGNORE','ESCALATE','CORRECT_MAPPING']
const environments=['SIMULATOR','DEVELOPMENT','TEST','STAGING','PRODUCTION']
const transports=['HTTPS_WEBHOOK','POLLING','SYNTHETIC_SIMULATOR']
const intakeModes=['MANUAL_ONLY','CAD_ENABLED','HYBRID']

async function json(url:string,init?:RequestInit){
  const response=await fetch(url,init)
  const body=await response.json()
  if(!response.ok)throw new Error(body.error||'CAD operation failed.')
  return body
}

export default function CadOperationsDashboard(){
  const [tab,setTab]=useState(0)
  const [summary,setSummary]=useState<Summary|null>(null)
  const [connections,setConnections]=useState<Connection[]>([])
  const [conflicts,setConflicts]=useState<Conflict[]>([])
  const [unmapped,setUnmapped]=useState<Unmapped[]>([])
  const [unknownUnits,setUnknownUnits]=useState<UnknownUnit[]>([])
  const [unknownPersonnel,setUnknownPersonnel]=useState<UnknownPerson[]>([])
  const [messages,setMessages]=useState<Message[]>([])
  const [rmsUnits,setRmsUnits]=useState<Option[]>([])
  const [rmsPersonnel,setRmsPersonnel]=useState<Option[]>([])
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const [selectedMessageIds,setSelectedMessageIds]=useState<string[]>([])
  const [reason,setReason]=useState('Reviewed by CAD administrator')
  const [editingConnection,setEditingConnection]=useState<Connection|null>(null)
  const [connectionForm,setConnectionForm]=useState({name:'Demo CAD',vendor:'GENERIC',adapterKey:'generic',adapterVersion:'1.0',environment:'SIMULATOR',transportType:'SYNTHETIC_SIMULATOR',intakeMode:'HYBRID'})

  async function load(){
    setError('')
    try{
      const [s,c,cf,u,uu,up,m,units,personnel]=await Promise.all([
        json('/api/cad/summary'),
        json('/api/cad/connections'),
        json('/api/cad/conflicts?status=OPEN'),
        json('/api/cad/unmapped-values'),
        json('/api/cad/unknown-units'),
        json('/api/cad/unknown-personnel'),
        json('/api/cad/messages'),
        json('/api/rms/units'),
        json('/api/rms/personnel')
      ])
      setSummary(s.data);setConnections(c.data||[]);setConflicts(cf.data||[]);setUnmapped(u.data||[])
      setUnknownUnits(uu.data||[]);setUnknownPersonnel(up.data||[]);setMessages(m.data||[])
      setRmsUnits(units.data||[]);setRmsPersonnel(personnel.data||[])
    }catch(err){setError(err instanceof Error?err.message:'Unable to load CAD operations.')}
  }

  useEffect(()=>{void load()},[])

  async function actConnection(id:string,action:'ENABLE'|'DISABLE'|'TEST'){
    setBusy(true);setError('');setMessage('')
    try{await json(`/api/cad/connections/${id}/action`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});await load();setMessage(`CAD connection ${action.toLowerCase()} action completed.`)}
    catch(err){setError(err instanceof Error?err.message:'CAD connection action failed.')}finally{setBusy(false)}
  }

  function startEditConnection(row:Connection){
    setEditingConnection(row)
    setConnectionForm({
      name:row.name,
      vendor:row.vendor,
      adapterKey:row.adapterKey,
      adapterVersion:row.adapterVersion,
      environment:row.environment,
      transportType:row.transportType,
      intakeMode:row.intakeMode
    })
  }

  function resetConnectionForm(){
    setEditingConnection(null)
    setConnectionForm({name:'Demo CAD',vendor:'GENERIC',adapterKey:'generic',adapterVersion:'1.0',environment:'SIMULATOR',transportType:'SYNTHETIC_SIMULATOR',intakeMode:'HYBRID'})
  }

  async function createConnection(){
    setBusy(true);setError('');setMessage('')
    try{
      await json('/api/cad/connections',{
        method:editingConnection?'PATCH':'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(editingConnection
          ? {id:editingConnection.id,recordVersion:editingConnection.recordVersion,...connectionForm,configurationJson:{}}
          : {...connectionForm,configurationJson:{}})
      })
      resetConnectionForm()
      await load()
      setMessage(editingConnection?'CAD connection updated.':'CAD connection created.')
    }catch(err){setError(err instanceof Error?err.message:'Unable to save CAD connection.')}
    finally{setBusy(false)}
  }

  async function resolveConflict(row:Conflict,action:string){
    setBusy(true);setError('');setMessage('')
    try{await json(`/api/cad/conflicts/${row.id}/resolve`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resolutionAction:action,resolutionReason:reason,recordVersion:row.recordVersion})});await load();setMessage('CAD conflict updated.')}
    catch(err){setError(err instanceof Error?err.message:'Unable to resolve conflict.')}finally{setBusy(false)}
  }

  async function resolveUnmapped(row:Unmapped,status:string){
    setBusy(true);setError('');setMessage('')
    try{await json(`/api/cad/unmapped-values/${row.id}/resolve`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resolutionReason:reason,recordVersion:row.recordVersion,status})});await load();setMessage('CAD value exception resolved.')}
    catch(err){setError(err instanceof Error?err.message:'Unable to resolve CAD value.')}finally{setBusy(false)}
  }

  async function resolveUnknownUnit(row:UnknownUnit,forgeUnitId:string,status='MAPPED'){
    setBusy(true);setError('');setMessage('')
    try{await json(`/api/cad/unknown-units/${row.id}/resolve`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resolutionReason:reason,recordVersion:row.recordVersion,status,forgeUnitId:forgeUnitId||null,mappingType:'UNIT',externalAgency:false})});await load();setMessage('CAD unit mapping updated.')}
    catch(err){setError(err instanceof Error?err.message:'Unable to resolve CAD unit.')}finally{setBusy(false)}
  }

  async function resolveUnknownPerson(row:UnknownPerson,forgePersonnelId:string,status='MAPPED'){
    setBusy(true);setError('');setMessage('')
    try{await json(`/api/cad/unknown-personnel/${row.id}/resolve`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resolutionReason:reason,recordVersion:row.recordVersion,status,forgePersonnelId:forgePersonnelId||null,mappingType:'PERSONNEL',externalAgency:false})});await load();setMessage('CAD personnel mapping updated.')}
    catch(err){setError(err instanceof Error?err.message:'Unable to resolve CAD personnel.')}finally{setBusy(false)}
  }

  async function reprocess(id:string){
    setBusy(true);setError('');setMessage('')
    try{await json(`/api/cad/messages/${id}/reprocess`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason})});await load();setMessage('CAD message queued for reprocessing.')}
    catch(err){setError(err instanceof Error?err.message:'Unable to reprocess CAD message.')}finally{setBusy(false)}
  }

  async function replay(){
    if(!selectedMessageIds.length)return
    setBusy(true);setError('');setMessage('')
    try{await json('/api/cad/messages/replay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rawMessageIds:selectedMessageIds,reason})});setSelectedMessageIds([]);await load();setMessage('Selected CAD messages queued for replay.')}
    catch(err){setError(err instanceof Error?err.message:'Unable to replay CAD messages.')}finally{setBusy(false)}
  }

  const unresolvedUnmapped=useMemo(()=>unmapped.filter(x=>!['MAPPED','IGNORED_WITH_REASON'].includes(x.status)),[unmapped])
  const unresolvedUnits=useMemo(()=>unknownUnits.filter(x=>!['MAPPED','IGNORED_WITH_REASON'].includes(x.status)),[unknownUnits])
  const unresolvedPersonnel=useMemo(()=>unknownPersonnel.filter(x=>!['MAPPED','IGNORED_WITH_REASON'].includes(x.status)),[unknownPersonnel])

  return <Box sx={{display:'grid',gap:3}}>
    {error?<Alert severity='error'>{error}</Alert>:null}
    {message?<Alert severity='success'>{message}</Alert>:null}

    <Card><CardContent>
      <Typography variant='h4'>CAD Operations</Typography>
      <Typography color='text.secondary'>Connections, intake health, message processing, conflicts, mapping exceptions, and incident linkage.</Typography>
      <Tabs value={tab} onChange={(_,value)=>setTab(value)} variant='scrollable' sx={{mt:3,borderBottom:1,borderColor:'divider'}}>
        <Tab label='Overview'/><Tab label='Connections'/><Tab label='Conflicts'/><Tab label='Mapping Exceptions'/><Tab label='Messages'/>
      </Tabs>
    </CardContent></Card>

    {tab===0?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3}}>
      {[
        ['Connections',summary?.connections.length??'—'],
        ['Messages Received',summary?.messages.received??'—'],
        ['Open Conflicts',summary?.openConflicts??'—'],
        ['Active CAD Links',summary?.activeLinks??'—'],
        ['Unmapped Values',summary?.unmappedValues??'—'],
        ['Unknown Units',summary?.unknownUnits??'—'],
        ['Unknown Personnel',summary?.unknownPersonnel??'—'],
        ['Requires Review',summary?.messages.requiresReview??'—']
      ].map(([label,value])=><Card key={String(label)}><CardContent><Typography variant='caption' color='text.secondary'>{label}</Typography><Typography variant='h4'>{value}</Typography></CardContent></Card>)}
      <Card sx={{gridColumn:{xl:'1 / -1'}}}><CardContent><Typography variant='h5'>Message Processing</Typography><Box sx={{display:'flex',gap:1,flexWrap:'wrap',mt:2}}>{Object.entries(summary?.messages.byStatus||{}).map(([status,count])=><Chip key={status} variant='tonal' label={status.replaceAll('_',' ')+' · '+count}/>)}</Box></CardContent></Card>
    </Box>:null}

    {tab===1?<Box sx={{display:'grid',gap:3}}>
      <Card><CardContent><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:2,mb:3}}><Typography variant='h5'>{editingConnection?'Edit CAD Connection':'Add CAD Connection'}</Typography>{editingConnection?<Button size='small' onClick={resetConnectionForm}>Cancel Edit</Button>:null}</Box>
        <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(2,1fr)'},gap:3}}>
          <TextField label='Name' value={connectionForm.name} onChange={e=>setConnectionForm(v=>({...v,name:e.target.value}))}/>
          <TextField label='Vendor' value={connectionForm.vendor} onChange={e=>setConnectionForm(v=>({...v,vendor:e.target.value}))}/>
          <TextField label='Adapter Key' value={connectionForm.adapterKey} onChange={e=>setConnectionForm(v=>({...v,adapterKey:e.target.value}))}/>
          <TextField label='Adapter Version' value={connectionForm.adapterVersion} onChange={e=>setConnectionForm(v=>({...v,adapterVersion:e.target.value}))}/>
          <TextField select label='Environment' value={connectionForm.environment} onChange={e=>setConnectionForm(v=>({...v,environment:e.target.value}))}>{environments.map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField>
          <TextField select label='Transport' value={connectionForm.transportType} onChange={e=>setConnectionForm(v=>({...v,transportType:e.target.value}))}>{transports.map(x=><MenuItem key={x} value={x}>{x.replaceAll('_',' ')}</MenuItem>)}</TextField>
          <TextField select label='Intake Mode' value={connectionForm.intakeMode} onChange={e=>setConnectionForm(v=>({...v,intakeMode:e.target.value}))}>{intakeModes.map(x=><MenuItem key={x} value={x}>{x.replaceAll('_',' ')}</MenuItem>)}</TextField>
        </Box>
        <Box sx={{display:'flex',justifyContent:'flex-end',mt:3}}><Button variant='contained' color='error' disabled={busy} onClick={()=>void createConnection()}>{editingConnection?'Save Connection':'Create Connection'}</Button></Box>
      </CardContent></Card>

      {connections.map(row=><Card key={row.id}><CardContent>
        <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'flex-start',flexWrap:'wrap'}}>
          <Box><Typography variant='h5'>{row.name}</Typography><Typography color='text.secondary'>{row.vendor} · {row.adapterKey} {row.adapterVersion} · {row.environment}</Typography></Box>
          <Box sx={{display:'flex',gap:1,flexWrap:'wrap'}}><Chip variant='tonal' label={row.status}/><Chip variant='tonal' color={row.healthStatus==='HEALTHY'?'success':'warning'} label={row.healthStatus}/></Box>
        </Box>
        <Typography variant='body2' sx={{mt:2}}>Transport: {row.transportType} · Intake: {row.intakeMode}</Typography>
        {row.lastErrorSummary?<Alert severity='warning' sx={{mt:2}}>{row.lastErrorSummary}</Alert>:null}
        <Box sx={{display:'flex',gap:1,flexWrap:'wrap',mt:3}}>
          <Button variant='outlined' disabled={busy} onClick={()=>startEditConnection(row)}>Edit</Button>
          <Button variant='outlined' disabled={busy} onClick={()=>void actConnection(row.id,'TEST')}>Test</Button>
          {row.status==='ACTIVE'||row.status==='ENABLED'?<Button color='warning' variant='outlined' disabled={busy} onClick={()=>void actConnection(row.id,'DISABLE')}>Disable</Button>:<Button variant='contained' disabled={busy} onClick={()=>void actConnection(row.id,'ENABLE')}>Enable</Button>}
        </Box>
      </CardContent></Card>)}
    </Box>:null}

    {tab===2?<Box sx={{display:'grid',gap:3}}>
      <TextField label='Resolution Reason' value={reason} onChange={e=>setReason(e.target.value)}/>
      {conflicts.map(row=><Card key={row.id}><CardContent>
        <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'center',flexWrap:'wrap'}}>
          <Box><Typography variant='h5'>{row.conflictType.replaceAll('_',' ')}</Typography><Typography color='text.secondary'>{row.fieldIdentifier||'No field identifier'} · {row.incidentId||'No incident linked'}</Typography></Box>
          <Chip variant='tonal' color={row.severity==='HIGH'||row.severity==='CRITICAL'?'error':'warning'} label={row.severity}/>
        </Box>
        <Box sx={{display:'flex',gap:1,flexWrap:'wrap',mt:3}}>{resolutionActions.map(action=><Button key={action} size='small' variant={action==='ESCALATE'?'outlined':'tonal'} color={action==='ESCALATE'?'warning':'primary'} disabled={busy} onClick={()=>void resolveConflict(row,action)}>{action.replaceAll('_',' ')}</Button>)}</Box>
      </CardContent></Card>)}
      {!conflicts.length?<Alert severity='success'>No open CAD conflicts.</Alert>:null}
    </Box>:null}

    {tab===3?<Box sx={{display:'grid',gap:3}}>
      <TextField label='Resolution Reason' value={reason} onChange={e=>setReason(e.target.value)}/>
      <Card><CardContent><Typography variant='h5'>Unmapped Values</Typography><Box sx={{display:'grid',gap:2,mt:2}}>{unresolvedUnmapped.map(row=><Box key={row.id} sx={{p:2,border:'1px solid',borderColor:'divider',borderRadius:2}}><Typography fontWeight={700}>{row.sourceField}: {row.sourceValue}</Typography><Typography variant='caption' color='text.secondary'>{row.category} · Seen {row.occurrenceCount} times</Typography><Box sx={{display:'flex',gap:1,mt:2}}><Button size='small' onClick={()=>void resolveUnmapped(row,'MAPPED')}>Mark Mapped</Button><Button size='small' color='warning' onClick={()=>void resolveUnmapped(row,'IGNORED_WITH_REASON')}>Ignore</Button><Button size='small' color='error' onClick={()=>void resolveUnmapped(row,'ESCALATED')}>Escalate</Button></Box></Box>)}</Box></CardContent></Card>
      <Card><CardContent><Typography variant='h5'>Unknown Units</Typography><Box sx={{display:'grid',gap:2,mt:2}}>{unresolvedUnits.map(row=><Box key={row.id} sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr auto'},gap:2,alignItems:'center',p:2,border:'1px solid',borderColor:'divider',borderRadius:2}}><Box><Typography fontWeight={700}>{row.sourceUnitCallsign||row.sourceUnitId}</Typography><Typography variant='caption'>Source ID: {row.sourceUnitId}</Typography></Box><TextField select size='small' label='Forge Unit' defaultValue='' onChange={e=>{if(e.target.value)void resolveUnknownUnit(row,e.target.value)}}><MenuItem value=''>Select mapping</MenuItem>{rmsUnits.map(unit=><MenuItem key={unit.id} value={unit.id}>{unit.callSign||unit.unitNumber||unit.name||unit.id}</MenuItem>)}</TextField><Button size='small' color='warning' onClick={()=>void resolveUnknownUnit(row,'','IGNORED_WITH_REASON')}>Ignore</Button></Box>)}</Box></CardContent></Card>
      <Card><CardContent><Typography variant='h5'>Unknown Personnel</Typography><Box sx={{display:'grid',gap:2,mt:2}}>{unresolvedPersonnel.map(row=><Box key={row.id} sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr auto'},gap:2,alignItems:'center',p:2,border:'1px solid',borderColor:'divider',borderRadius:2}}><Box><Typography fontWeight={700}>{row.sourceName||row.sourcePersonnelId}</Typography><Typography variant='caption'>Source ID: {row.sourcePersonnelId}</Typography></Box><TextField select size='small' label='Forge Personnel' defaultValue='' onChange={e=>{if(e.target.value)void resolveUnknownPerson(row,e.target.value)}}><MenuItem value=''>Select mapping</MenuItem>{rmsPersonnel.map(person=><MenuItem key={person.id} value={person.id}>{person.displayName||person.personId||person.name||person.id}</MenuItem>)}</TextField><Button size='small' color='warning' onClick={()=>void resolveUnknownPerson(row,'','IGNORED_WITH_REASON')}>Ignore</Button></Box>)}</Box></CardContent></Card>
    </Box>:null}

    {tab===4?<Box sx={{display:'grid',gap:3}}>
      <Box sx={{display:'flex',gap:2,flexWrap:'wrap',alignItems:'center'}}><TextField label='Replay / Reprocess Reason' value={reason} onChange={e=>setReason(e.target.value)} sx={{minWidth:320}}/><Button variant='contained' disabled={busy||!selectedMessageIds.length} onClick={()=>void replay()}>Replay Selected ({selectedMessageIds.length})</Button></Box>
      <Card><CardContent><Box sx={{display:'grid',gap:2}}>
        {messages.map(row=><Box key={row.id} sx={{display:'grid',gridTemplateColumns:{xs:'auto 1fr',lg:'auto 1.1fr .8fr .8fr auto'},gap:2,alignItems:'center',p:2,borderBottom:'1px solid',borderColor:'divider'}}>
          <Checkbox checked={selectedMessageIds.includes(row.id)} onChange={e=>setSelectedMessageIds(current=>e.target.checked?[...current,row.id]:current.filter(id=>id!==row.id))}/>
          <Box><Typography fontWeight={700}>{row.sourceMessageId||row.id}</Typography><Typography variant='caption' color='text.secondary'>{new Date(row.receivedAt).toLocaleString()}</Typography></Box>
          <Typography>{row.sourceIncidentId||'No source incident'}</Typography>
          <Chip size='small' variant='tonal' color={row.processingStatus==='FAILED'||row.processingStatus==='DEAD_LETTER'?'error':row.processingStatus==='APPLIED'?'success':'warning'} label={row.processingStatus}/>
          <Button size='small' disabled={busy} onClick={()=>void reprocess(row.id)}>Reprocess</Button>
        </Box>)}
        {!messages.length?<Typography color='text.secondary'>No CAD messages recorded.</Typography>:null}
      </Box></CardContent></Card>
    </Box>:null}
  </Box>
}
