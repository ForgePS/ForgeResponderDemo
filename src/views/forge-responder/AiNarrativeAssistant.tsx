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

type RequestType=
  | 'GENERATE_FROM_RECORD'
  | 'IMPROVE_EXISTING'
  | 'GRAMMAR_AND_CLARITY'
  | 'EXPAND_BRIEF_NOTES'
  | 'CONDENSE'
  | 'PROFESSIONALIZE'
  | 'ACTIVE_VOICE'
  | 'TIMELINE_FORMAT'
  | 'QUALITY_REVIEW'
  | 'MISSING_INFORMATION_CHECK'
  | 'CONTRADICTION_CHECK'

type Bundle={
  request:{id:string;requestType:string;provider:string|null}
  drafts:Array<{
    id:string
    draftText:string
    confidenceSummary:string|null
    structuredResponseJson:{
      missingInformation?:string[]
      conflicts?:string[]
      warnings?:string[]
      unsupportedClaims?:string[]
    }
  }>
  requiredWarning:string
  humanReviewRequired:boolean
}

export default function AiNarrativeAssistant({
  incidentId,
  currentNarrative,
  recordVersion,
  onAccepted
}:{
  incidentId:string
  currentNarrative:string
  recordVersion:number
  onAccepted:(narrative:string,recordVersion:number)=>void
}){
  const [requestType,setRequestType]=useState<RequestType>('GENERATE_FROM_RECORD')
  const [bundle,setBundle]=useState<Bundle|null>(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')

  const draft=bundle?.drafts?.[0]

  async function generate(){
    setBusy(true);setError('');setMessage('')
    try{
      const response=await fetch(`/api/incidents/${incidentId}/ai-narrative`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({requestType,existingNarrative:currentNarrative||null})
      })
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to generate assistant draft.')
      setBundle(body.data)
    }catch(err){setError(err instanceof Error?err.message:'Unable to generate assistant draft.')}
    finally{setBusy(false)}
  }

  async function accept(){
    if(!bundle||!draft)return
    setBusy(true);setError('');setMessage('')
    try{
      const response=await fetch(`/api/incidents/${incidentId}/ai-narrative/accept`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          requestId:bundle.request.id,
          draftId:draft.id,
          draftText:draft.draftText,
          recordVersion
        })
      })
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to accept assistant draft.')
      onAccepted(String(body.data.narrative||draft.draftText),Number(body.data.recordVersion||recordVersion))
      setMessage('Assistant draft accepted into the incident narrative.')
    }catch(err){setError(err instanceof Error?err.message:'Unable to accept assistant draft.')}
    finally{setBusy(false)}
  }

  return <Card variant='outlined'>
    <CardContent>
      <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:2,flexWrap:'wrap'}}>
        <Box>
          <Typography variant='h5'>Ask Forge — Narrative Assistant</Typography>
          <Typography color='text.secondary'>Generate or review a narrative from documented incident information.</Typography>
        </Box>
        <Chip variant='tonal' color='info' label='Human review required'/>
      </Box>

      {error?<Alert severity='error' sx={{mt:3}}>{error}</Alert>:null}
      {message?<Alert severity='success' sx={{mt:3}}>{message}</Alert>:null}

      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr auto'},gap:2,mt:3}}>
        <TextField select label='Assistant Task' value={requestType} onChange={e=>setRequestType(e.target.value as RequestType)}>
          <MenuItem value='GENERATE_FROM_RECORD'>Generate from record</MenuItem>
          <MenuItem value='IMPROVE_EXISTING'>Improve existing narrative</MenuItem>
          <MenuItem value='GRAMMAR_AND_CLARITY'>Grammar & clarity</MenuItem>
          <MenuItem value='EXPAND_BRIEF_NOTES'>Expand brief notes</MenuItem>
          <MenuItem value='CONDENSE'>Condense</MenuItem>
          <MenuItem value='PROFESSIONALIZE'>Professionalize</MenuItem>
          <MenuItem value='ACTIVE_VOICE'>Active voice</MenuItem>
          <MenuItem value='TIMELINE_FORMAT'>Timeline format</MenuItem>
          <MenuItem value='QUALITY_REVIEW'>Quality review</MenuItem>
          <MenuItem value='MISSING_INFORMATION_CHECK'>Missing information check</MenuItem>
          <MenuItem value='CONTRADICTION_CHECK'>Contradiction check</MenuItem>
        </TextField>
        <Button variant='contained' color='error' disabled={busy} onClick={()=>void generate()}>{busy?'Working…':'Run Ask Forge'}</Button>
      </Box>

      {bundle&&draft?<Box sx={{display:'grid',gap:2,mt:3}}>
        <Alert severity='warning' variant='outlined'>{bundle.requiredWarning}</Alert>
        <TextField multiline minRows={10} fullWidth label='Assistant Draft' value={draft.draftText} InputProps={{readOnly:true}}/>
        {draft.confidenceSummary?<Typography color='text.secondary'>{draft.confidenceSummary}</Typography>:null}
        {draft.structuredResponseJson.missingInformation?.length?<Alert severity='warning'><Typography fontWeight={700}>Missing information</Typography>{draft.structuredResponseJson.missingInformation.map(item=><div key={item}>{item}</div>)}</Alert>:null}
        {draft.structuredResponseJson.conflicts?.length?<Alert severity='error'><Typography fontWeight={700}>Potential conflicts</Typography>{draft.structuredResponseJson.conflicts.map(item=><div key={item}>{item}</div>)}</Alert>:null}
        {draft.structuredResponseJson.warnings?.length?<Alert severity='info'><Typography fontWeight={700}>Assistant notes</Typography>{draft.structuredResponseJson.warnings.map(item=><div key={item}>{item}</div>)}</Alert>:null}
        <Box sx={{display:'flex',justifyContent:'flex-end'}}><Button variant='contained' color='success' disabled={busy} onClick={()=>void accept()}>Accept into Narrative</Button></Box>
      </Box>:null}
    </CardContent>
  </Card>
}
