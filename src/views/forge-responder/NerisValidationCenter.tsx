'use client'

import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

type IncidentOption={id:string;incidentNumber:string;status:string;incidentDate?:string|null;primaryIncidentTypeCode?:string|null}
type Finding={severity:'GUIDANCE'|'WARNING'|'BLOCKING_ERROR';code:string;message:string;sectionKey?:string|null}

export default function NerisValidationCenter({incidents}:{incidents:IncidentOption[]}) {
  const [incidentId,setIncidentId]=useState(incidents[0]?.id||'')
  const [findings,setFindings]=useState<Finding[]>([])
  const [result,setResult]=useState<{ok:boolean;blockingErrorCount:number;warningCount:number;guidanceCount:number}|null>(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const selected=incidents.find(x=>x.id===incidentId)

  async function run(){
    if(!incidentId)return
    setBusy(true);setError('')
    try{
      const response=await fetch('/api/incidents/'+incidentId+'/validate',{method:'POST'})
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to validate incident.')
      setFindings(body.data?.findings||[])
      setResult({ok:Boolean(body.data?.ok),blockingErrorCount:Number(body.data?.blockingErrorCount||0),warningCount:Number(body.data?.warningCount||0),guidanceCount:Number(body.data?.guidanceCount||0)})
    }catch(err){setError(err instanceof Error?err.message:'Unable to validate incident.')}
    finally{setBusy(false)}
  }

  return <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'1.25fr .75fr'},gap:3}}>
    <Card><CardContent>
      <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:2,flexWrap:'wrap'}}>
        <div><Typography variant='h5'>Incident Validation Center</Typography><Typography color='text.secondary'>Run the same validation route used by officer review.</Typography></div>
        <Chip color={result?.ok?'success':result?'warning':'default'} variant='tonal' label={result?.ok?'Validation Passed':result?'Findings Present':'Ready'}/>
      </Box>
      <TextField select fullWidth label='Incident' value={incidentId} onChange={e=>{setIncidentId(e.target.value);setResult(null);setFindings([])}} sx={{mt:3}}>
        {incidents.map(incident=><MenuItem key={incident.id} value={incident.id}>{incident.incidentNumber+' — '+(incident.primaryIncidentTypeCode||'Unclassified')+' — '+incident.status.replaceAll('_',' ')}</MenuItem>)}
      </TextField>
      {error?<Alert severity='error' sx={{mt:3}}>{error}</Alert>:null}
      {!incidents.length?<Alert severity='info' sx={{mt:3}}>Create an incident before running NERIS validation.</Alert>:null}
      {findings.length?<Box sx={{display:'grid',gap:1.5,mt:3}}>{findings.map((finding,index)=><Alert key={finding.code+'-'+index} severity={finding.severity==='BLOCKING_ERROR'?'error':finding.severity==='WARNING'?'warning':'info'} variant='outlined'><Typography fontWeight={700}>{finding.message}</Typography><Typography variant='caption'>{(finding.sectionKey?finding.sectionKey.replaceAll('_',' ')+' · ':'')+finding.code}</Typography></Alert>)}</Box>:result?<Alert severity='success' sx={{mt:3}}>No validation findings were returned.</Alert>:null}
      <Button disabled={!incidentId||busy} onClick={()=>void run()} variant='contained' color='error' sx={{mt:3}} startIcon={<i className='tabler-scan'/>}>{busy?'Validating…':'Run NERIS Validation'}</Button>
    </CardContent></Card>
    <Card><CardContent>
      <Typography variant='h5'>Validation Summary</Typography>
      <Typography color='text.secondary' sx={{mt:1,mb:3}}>{selected?selected.incidentNumber:'Select an incident'}</Typography>
      <Box sx={{display:'grid',gap:2}}>
        <Box><Typography variant='caption' color='text.secondary'>Blocking Errors</Typography><Typography variant='h4'>{result?.blockingErrorCount??'—'}</Typography></Box>
        <Box><Typography variant='caption' color='text.secondary'>Warnings</Typography><Typography variant='h4'>{result?.warningCount??'—'}</Typography></Box>
        <Box><Typography variant='caption' color='text.secondary'>Guidance</Typography><Typography variant='h4'>{result?.guidanceCount??'—'}</Typography></Box>
        <Box><Typography variant='caption' color='text.secondary'>Workflow Status</Typography><Typography fontWeight={700}>{selected?.status.replaceAll('_',' ')||'—'}</Typography></Box>
      </Box>
      <Alert severity='info' variant='outlined' sx={{mt:3}}>Validation checks the incident record; it does not submit or finalize the incident.</Alert>
    </CardContent></Card>
  </Box>
}
