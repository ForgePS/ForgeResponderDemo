'use client'

import { useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import NerisDynamicForm from '@views/forge-responder/NerisDynamicForm'
import SpecialtyRecordsPanel from '@views/forge-responder/SpecialtyRecordsPanel'
import AiNarrativeAssistant from '@views/forge-responder/AiNarrativeAssistant'
import CadIncidentPanel from '@views/forge-responder/CadIncidentPanel'
import SpecialtyReviewSummary from '@views/forge-responder/SpecialtyReviewSummary'

type Incident={
  id:string
  incidentNumber:string
  status:string
  incidentDate?:string|null
  alarmAt?:string|null
  stationId?:string|null
  shiftId?:string|null
  responseDistrict?:string|null
  dispatchDescription?:string|null
  primaryIncidentTypeCode?:string|null
  recordVersion:number
}

type Option={id:string;name?:string;stationNumber?:string;code?:string;callSign?:string;unitNumber?:string;unitType?:string;personId?:string;displayName?:string;rank?:string}
type ValidationFinding={severity:string;code:string;message:string;sectionKey?:string|null}

export default function IncidentWorkspace({
  initialIncident,
  lang,
  stations,
  shifts,
  units,
  personnel
}:{
  initialIncident:Incident
  lang:string
  stations:Option[]
  shifts:Option[]
  units:Option[]
  personnel:Option[]
}) {
  const [incident,setIncident]=useState(initialIncident)
  const [tab,setTab]=useState(0)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const [busy,setBusy]=useState(false)
  const [narrative,setNarrative]=useState('')
  const [versionNote,setVersionNote]=useState('')
  const [unitAssignments,setUnitAssignments]=useState<Record<string,unknown>[]>([])
  const [personAssignments,setPersonAssignments]=useState<Record<string,unknown>[]>([])
  const [selectedUnit,setSelectedUnit]=useState('')
  const [selectedPerson,setSelectedPerson]=useState('')
  const [findings,setFindings]=useState<ValidationFinding[]>([])
  const [returnReason,setReturnReason]=useState('')
  const [submitNote,setSubmitNote]=useState('')
  const [reviewComment,setReviewComment]=useState('')
  const [reviewComments,setReviewComments]=useState<Record<string,unknown>[]>([])
  const [statusHistory,setStatusHistory]=useState<Record<string,unknown>[]>([])

  const unitMap=useMemo(()=>new Map(units.map(x=>[x.id,x])),[units])
  const personnelMap=useMemo(()=>new Map(personnel.map(x=>[x.id,x])),[personnel])

  async function loadRelated(){
    try{
      const [n,u,p,comments,history]=await Promise.all([
        fetch(`/api/incidents/${incident.id}/narrative`,{cache:'no-store'}).then(r=>r.json()),
        fetch(`/api/incidents/${incident.id}/units`,{cache:'no-store'}).then(r=>r.json()),
        fetch(`/api/incidents/${incident.id}/personnel`,{cache:'no-store'}).then(r=>r.json()),
        fetch(`/api/incidents/${incident.id}/review-comments`,{cache:'no-store'}).then(r=>r.json()),
        fetch(`/api/incidents/${incident.id}/status-history`,{cache:'no-store'}).then(r=>r.json())
      ])
      setNarrative(n.data?.body||'')
      setUnitAssignments(u.data||[])
      setPersonAssignments(p.data||[])
      setReviewComments(comments.data||[])
      setStatusHistory(history.data||[])
    }catch{}
  }

  useEffect(()=>{void loadRelated()},[])

  async function refreshIncident(){
    const response=await fetch(`/api/incidents/${incident.id}`,{cache:'no-store'})
    const body=await response.json()
    if(!response.ok) throw new Error(body.error||'Unable to reload incident.')
    setIncident(body.data)
    return body.data as Incident
  }

  async function saveOverview(){
    setBusy(true);setError('');setMessage('')
    try{
      const response=await fetch(`/api/incidents/${incident.id}`,{
        method:'PATCH',
        headers:{'Content-Type':'application/json','x-record-version':String(incident.recordVersion)},
        body:JSON.stringify({
          incidentDate:incident.incidentDate||null,
          stationId:incident.stationId||null,
          shiftId:incident.shiftId||null,
          responseDistrict:incident.responseDistrict||null,
          dispatchDescription:incident.dispatchDescription||null,
          primaryIncidentTypeCode:incident.primaryIncidentTypeCode||null
        })
      })
      const body=await response.json()
      if(!response.ok) throw new Error(body.error||'Unable to save incident.')
      setIncident(body.data);setMessage('Incident overview saved.')
    }catch(err){setError(err instanceof Error?err.message:'Unable to save incident.')}
    finally{setBusy(false)}
  }

  async function addUnit(){
    if(!selectedUnit)return
    setBusy(true);setError('')
    try{
      const response=await fetch(`/api/incidents/${incident.id}/units`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({unitId:selectedUnit,isPrimary:unitAssignments.length===0,unitRole:unitAssignments.length===0?'PRIMARY_RESPONSE':'RESPONSE'})
      })
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to assign unit.')
      setSelectedUnit('');await loadRelated();setMessage('Unit assigned.')
    }catch(err){setError(err instanceof Error?err.message:'Unable to assign unit.')}
    finally{setBusy(false)}
  }

  async function addPerson(){
    if(!selectedPerson)return
    setBusy(true);setError('')
    try{
      const p=personnelMap.get(selectedPerson)
      const response=await fetch(`/api/incidents/${incident.id}/personnel`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({personnelId:selectedPerson,role:'RESPONDER',rank:p?.rank||undefined})
      })
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to assign personnel.')
      setSelectedPerson('');await loadRelated();setMessage('Personnel assigned.')
    }catch(err){setError(err instanceof Error?err.message:'Unable to assign personnel.')}
    finally{setBusy(false)}
  }

  async function saveNarrative(){
    setBusy(true);setError('');setMessage('')
    try{
      const latest=await refreshIncident()
      const response=await fetch(`/api/incidents/${incident.id}/narrative`,{
        method:'PATCH',
        headers:{'Content-Type':'application/json','x-record-version':String(latest.recordVersion)},
        body:JSON.stringify({body:narrative,versionNote:versionNote||undefined})
      })
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to save narrative.')
      await refreshIncident();setMessage('Narrative saved.')
    }catch(err){setError(err instanceof Error?err.message:'Unable to save narrative.')}
    finally{setBusy(false)}
  }

  async function addReviewComment(){
    if(!reviewComment.trim())return
    setBusy(true);setError('');setMessage('')
    try{
      const response=await fetch(`/api/incidents/${incident.id}/review-comments`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({body:reviewComment})
      })
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to add review comment.')
      setReviewComment('')
      await loadRelated()
      setMessage('Review comment added.')
    }catch(err){setError(err instanceof Error?err.message:'Unable to add review comment.')}
    finally{setBusy(false)}
  }

  async function validate(){
    setBusy(true);setError('');setMessage('')
    try{
      const response=await fetch(`/api/incidents/${incident.id}/validate`,{method:'POST'})
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to validate incident.')
      setFindings(body.data?.findings||[])
      setMessage(body.data?.ok?'Validation passed.':'Validation completed with findings.')
    }catch(err){setError(err instanceof Error?err.message:'Unable to validate incident.')}
    finally{setBusy(false)}
  }

  async function action(path:string,payload?:unknown,success?:string){
    setBusy(true);setError('');setMessage('')
    try{
      const response=await fetch(`/api/incidents/${incident.id}/${path}`,{
        method:'POST',
        headers:payload?{'Content-Type':'application/json'}:undefined,
        body:payload?JSON.stringify(payload):undefined
      })
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Incident action failed.')
      setIncident(body.data)
      setMessage(success||'Incident updated.')
      await validate().catch(()=>{})
    }catch(err){setError(err instanceof Error?err.message:'Incident action failed.')}
    finally{setBusy(false)}
  }

  return <div>
    <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:2,flexWrap:'wrap',mb:3}}>
      <Button href={`/${lang}/incidents`} startIcon={<i className='tabler-arrow-left'/>}>Incidents</Button>
      <Chip variant='tonal' color={incident.status==='APPROVED'||incident.status==='FINALIZED'?'success':incident.status==='RETURNED_FOR_CORRECTION'?'error':incident.status==='SUBMITTED_FOR_REVIEW'?'info':'warning'} label={incident.status.replaceAll('_',' ')}/>
    </Box>

    {error?<Alert severity='error' sx={{mb:3}}>{error}</Alert>:null}
    {message?<Alert severity='success' sx={{mb:3}}>{message}</Alert>:null}

    <Card>
      <CardContent>
        <Typography variant='h4'>{incident.incidentNumber}</Typography>
        <Typography color='text.secondary'>{incident.primaryIncidentTypeCode||'Incident type not recorded'} · {incident.incidentDate||'No date'}</Typography>
        <Tabs value={tab} onChange={(_,value)=>setTab(value)} variant='scrollable' sx={{mt:3,borderBottom:1,borderColor:'divider'}}>
          <Tab label='Overview'/>
          <Tab label='Units & Personnel'/>
          <Tab label='NERIS Forms'/>
          <Tab label='Specialty Records'/>
          <Tab label='CAD'/>
          <Tab label='Narrative'/>
          <Tab label='Officer Review'/>
        </Tabs>

        {tab===0?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3,mt:4}}>
          <TextField label='Incident Date' type='date' value={incident.incidentDate||''} onChange={e=>setIncident(v=>({...v,incidentDate:e.target.value}))} InputLabelProps={{shrink:true}}/>
          <TextField label='Primary Incident Type Code' value={incident.primaryIncidentTypeCode||''} onChange={e=>setIncident(v=>({...v,primaryIncidentTypeCode:e.target.value}))}/>
          <TextField select label='Station' value={incident.stationId||''} onChange={e=>setIncident(v=>({...v,stationId:e.target.value}))}><MenuItem value=''>Not assigned</MenuItem>{stations.map(x=><MenuItem key={x.id} value={x.id}>{x.name||x.stationNumber||x.id}</MenuItem>)}</TextField>
          <TextField select label='Shift' value={incident.shiftId||''} onChange={e=>setIncident(v=>({...v,shiftId:e.target.value}))}><MenuItem value=''>Not assigned</MenuItem>{shifts.map(x=><MenuItem key={x.id} value={x.id}>{x.name||x.code||x.id}</MenuItem>)}</TextField>
          <TextField label='Response District' value={incident.responseDistrict||''} onChange={e=>setIncident(v=>({...v,responseDistrict:e.target.value}))}/>
          <TextField multiline minRows={4} sx={{gridColumn:{md:'1 / -1'}}} label='Dispatch Description' value={incident.dispatchDescription||''} onChange={e=>setIncident(v=>({...v,dispatchDescription:e.target.value}))}/>
          <Box sx={{gridColumn:{md:'1 / -1'},display:'flex',justifyContent:'flex-end'}}><Button variant='contained' color='error' disabled={busy} onClick={()=>void saveOverview()}>Save Overview</Button></Box>
        </Box>:null}

        {tab===1?<Box sx={{mt:4,display:'grid',gap:4}}>
          <Box><Typography variant='h5' sx={{mb:2}}>Unit Assignments</Typography>
            <Box sx={{display:'flex',gap:2,flexWrap:'wrap',mb:2}}><TextField select size='small' label='Unit' value={selectedUnit} onChange={e=>setSelectedUnit(e.target.value)} sx={{minWidth:280}}><MenuItem value=''>Select unit</MenuItem>{units.map(x=><MenuItem key={x.id} value={x.id}>{x.callSign||x.unitNumber||x.name||x.id}</MenuItem>)}</TextField><Button variant='contained' disabled={!selectedUnit||busy} onClick={()=>void addUnit()}>Assign Unit</Button></Box>
            <Box sx={{display:'flex',gap:1,flexWrap:'wrap'}}>{unitAssignments.map((a:any)=>{const u=unitMap.get(String(a.unitId));return <Chip key={String(a.id)} label={`${u?.callSign||u?.unitNumber||a.unitId}${a.isPrimary?' · Primary':''}`} variant='tonal' color={a.isPrimary?'error':'default'}/>})}</Box>
          </Box>
          <Divider/>
          <Box><Typography variant='h5' sx={{mb:2}}>Personnel Assignments</Typography>
            <Box sx={{display:'flex',gap:2,flexWrap:'wrap',mb:2}}><TextField select size='small' label='Personnel' value={selectedPerson} onChange={e=>setSelectedPerson(e.target.value)} sx={{minWidth:320}}><MenuItem value=''>Select personnel</MenuItem>{personnel.map(x=><MenuItem key={x.id} value={x.id}>{x.displayName||x.personId||x.id} {x.rank?`— ${x.rank}`:''}</MenuItem>)}</TextField><Button variant='contained' disabled={!selectedPerson||busy} onClick={()=>void addPerson()}>Assign Personnel</Button></Box>
            <Box sx={{display:'flex',gap:1,flexWrap:'wrap'}}>{personAssignments.map((a:any)=>{const p=personnelMap.get(String(a.personnelId));return <Chip key={String(a.id)} label={`${p?.displayName||p?.personId||a.personnelId}${a.role?` · ${a.role}`:''}`} variant='tonal'/>})}</Box>
          </Box>
        </Box>:null}

        {tab===2?<Box sx={{mt:4}}><NerisDynamicForm incidentId={incident.id} recordVersion={incident.recordVersion} onRecordVersion={version=>setIncident(current=>({...current,recordVersion:version}))}/></Box>:null}

        {tab===3?<Box sx={{mt:4}}><SpecialtyRecordsPanel incidentId={incident.id}/></Box>:null}

        {tab===4?<Box sx={{mt:4}}><CadIncidentPanel incidentId={incident.id} lang={lang}/></Box>:null}

        {tab===5?<Box sx={{display:'grid',gap:3,mt:4}}>
          <TextField multiline minRows={14} label='Incident Narrative' value={narrative} onChange={e=>setNarrative(e.target.value)}/>
          <TextField label='Version Note' value={versionNote} onChange={e=>setVersionNote(e.target.value)} placeholder='Optional revision note'/>
          <Box sx={{display:'flex',justifyContent:'flex-end'}}><Button variant='contained' color='error' disabled={busy} onClick={()=>void saveNarrative()}>Save Narrative</Button></Box>
          <AiNarrativeAssistant incidentId={incident.id} currentNarrative={narrative} recordVersion={incident.recordVersion} onAccepted={(nextNarrative,nextVersion)=>{setNarrative(nextNarrative);setIncident(current=>({...current,recordVersion:nextVersion}));setMessage('Assistant narrative accepted.')}}/>
        </Box>:null}

        {tab===6?<Box sx={{mt:4,display:'grid',gap:3}}>
          <SpecialtyReviewSummary incidentId={incident.id}/>
          <Box sx={{display:'flex',gap:2,flexWrap:'wrap'}}><Button variant='outlined' disabled={busy} onClick={()=>void validate()}>Run NERIS Validation</Button></Box>
          {findings.length?<Box sx={{display:'grid',gap:1}}>{findings.map((f,index)=><Alert key={`${f.code}-${index}`} severity={f.severity==='BLOCKING_ERROR'?'error':f.severity==='WARNING'?'warning':'info'}>{f.message}</Alert>)}</Box>:<Alert severity='info' variant='outlined'>Run validation to check the current incident for blocking errors, warnings, and guidance.</Alert>}
          <Divider/>
          <Box sx={{display:'grid',gap:2}}>
            <Typography variant='h5'>Review Comments</Typography>
            <TextField multiline minRows={2} label='Add Review Comment' value={reviewComment} onChange={e=>setReviewComment(e.target.value)}/>
            <Box sx={{display:'flex',justifyContent:'flex-end'}}><Button variant='outlined' disabled={busy||!reviewComment.trim()} onClick={()=>void addReviewComment()}>Add Comment</Button></Box>
            {reviewComments.length?reviewComments.map((comment:any)=><Box key={String(comment.id)} sx={{p:2,border:'1px solid',borderColor:'divider',borderRadius:2}}><Typography>{String(comment.body||'')}</Typography><Typography variant='caption' color='text.secondary'>{comment.authorUserId?String(comment.authorUserId):'Reviewer'} · {comment.createdAt?new Date(String(comment.createdAt)).toLocaleString():'Time not recorded'}</Typography></Box>):<Typography color='text.secondary'>No review comments yet.</Typography>}
          </Box>
          <Divider/>
          <TextField multiline minRows={2} label='Submit Note' value={submitNote} onChange={e=>setSubmitNote(e.target.value)}/>
          <Button variant='contained' color='error' disabled={busy||incident.status==='APPROVED'||incident.status==='FINALIZED'} onClick={()=>void action('submit',{note:submitNote||undefined},'Incident submitted for officer review.')}>Submit for Review</Button>
          <TextField multiline minRows={2} label='Return Reason' value={returnReason} onChange={e=>setReturnReason(e.target.value)}/>
          <Box sx={{display:'flex',gap:2,flexWrap:'wrap'}}>
            <Button variant='outlined' color='warning' disabled={busy||!returnReason.trim()} onClick={()=>void action('return',{reason:returnReason},'Incident returned for correction.')}>Return for Correction</Button>
            <Button variant='contained' color='success' disabled={busy||incident.status==='APPROVED'||incident.status==='FINALIZED'} onClick={()=>void action('approve',undefined,'Incident approved.')}>Approve Incident</Button>
          </Box>
          <Divider/>
          <Box sx={{display:'grid',gap:1}}>
            <Typography variant='h5'>Status History</Typography>
            {statusHistory.length?statusHistory.map((item:any)=><Box key={String(item.id)} sx={{display:'flex',justifyContent:'space-between',gap:2,p:1.5,borderBottom:'1px solid',borderColor:'divider'}}><Typography>{String(item.fromStatus||'CREATED').replaceAll('_',' ')} → {String(item.toStatus||'').replaceAll('_',' ')}</Typography><Typography variant='caption' color='text.secondary'>{item.createdAt?new Date(String(item.createdAt)).toLocaleString():'—'}</Typography></Box>):<Typography color='text.secondary'>No status history recorded.</Typography>}
          </Box>
        </Box>:null}
      </CardContent>
    </Card>
  </div>
}
