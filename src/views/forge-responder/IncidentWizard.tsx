'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

const steps=['Dispatch','Units & Personnel','Operations','Review']

type Option={id:string;name?:string;code?:string;stationNumber?:string;callSign?:string;unitNumber?:string;unitType?:string;personId?:string;displayName?:string;rank?:string}
type CadMessage={id:string;sourceIncidentId:string|null;sourceMessageId:string|null;cadConnectionId:string;processingStatus:string;receivedAt:string}

export default function IncidentWizard({
  lang,stations,shifts,units,personnel
}:{lang:string;stations:Option[];shifts:Option[];units:Option[];personnel:Option[]}) {
  const router=useRouter()
  const [step,setStep]=useState(0)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const [incidentDate,setIncidentDate]=useState(new Date().toISOString().slice(0,10))
  const [incidentSource,setIncidentSource]=useState('MANUAL')
  const [cadMessages,setCadMessages]=useState<CadMessage[]>([])
  const [cadMessageId,setCadMessageId]=useState('')
  const [alarmAt,setAlarmAt]=useState('')
  const [stationId,setStationId]=useState(stations[0]?.id||'')
  const [shiftId,setShiftId]=useState(shifts[0]?.id||'')
  const [incidentType,setIncidentType]=useState('STRUCTURE_FIRE')
  const [dispatchDescription,setDispatchDescription]=useState('')
  const [responseDistrict,setResponseDistrict]=useState('')
  const [unitId,setUnitId]=useState(units[0]?.id||'')
  const [officerId,setOfficerId]=useState(personnel[0]?.id||'')
  const [unitRole,setUnitRole]=useState('PRIMARY_RESPONSE')
  const [narrative,setNarrative]=useState('')

  useEffect(()=>{
    void fetch('/api/cad/messages',{cache:'no-store'})
      .then(async response=>{const body=await response.json();if(response.ok)setCadMessages((body.data||[]).filter((row:CadMessage)=>Boolean(row.sourceIncidentId)))})
      .catch(()=>{})
  },[])

  const selectedCadMessage=cadMessages.find(row=>row.id===cadMessageId)

  async function create(){
    setSaving(true);setError('')
    try{
      const payload=Object.fromEntries(Object.entries({
        incidentDate,
        alarmAt:alarmAt?new Date(`${incidentDate}T${alarmAt}:00`).toISOString():'',
        stationId,
        shiftId,
        responseDistrict,
        incidentSource,
        dispatchDescription,
        primaryIncidentTypeCode:incidentType
      }).filter(([,value])=>value!==''))

      const response=await fetch('/api/incidents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      const body=await response.json()
      if(!response.ok) throw new Error(body.error||'Unable to create incident.')
      const incident=body.data

      if(incidentSource==='CAD'&&selectedCadMessage?.sourceIncidentId){
        const linkResponse=await fetch(`/api/incidents/${incident.id}/cad-link`,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            cadConnectionId:selectedCadMessage.cadConnectionId,
            sourceIncidentId:selectedCadMessage.sourceIncidentId,
            reason:'Incident created from selected CAD message'
          })
        })
        const linkBody=await linkResponse.json()
        if(!linkResponse.ok)throw new Error(linkBody.error||'Incident created, but CAD linkage failed.')
      }

      if(unitId){
        const unitResponse=await fetch(`/api/incidents/${incident.id}/units`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({unitId,isPrimary:true,unitRole})})
        const unitBody=await unitResponse.json()
        if(!unitResponse.ok) throw new Error(unitBody.error||'Incident created, but primary unit assignment failed.')
      }

      if(officerId){
        const person=personnel.find(x=>x.id===officerId)
        const personResponse=await fetch(`/api/incidents/${incident.id}/personnel`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({personnelId:officerId,role:'OFFICER',rank:person?.rank||undefined,isIncidentCommander:true,isReportingOfficer:true})})
        const personBody=await personResponse.json()
        if(!personResponse.ok) throw new Error(personBody.error||'Incident created, but officer assignment failed.')
      }

      if(narrative.trim()){
        const latest=await fetch(`/api/incidents/${incident.id}`,{cache:'no-store'}).then(r=>r.json())
        const narrativeResponse=await fetch(`/api/incidents/${incident.id}/narrative`,{method:'PATCH',headers:{'Content-Type':'application/json','x-record-version':String(latest.data.recordVersion)},body:JSON.stringify({body:narrative,versionNote:'Initial incident narrative'})})
        const narrativeBody=await narrativeResponse.json()
        if(!narrativeResponse.ok) throw new Error(narrativeBody.error||'Incident created, but narrative save failed.')
      }

      router.push(`/${lang}/incidents/${incident.id}`)
      router.refresh()
    }catch(err){setError(err instanceof Error?err.message:'Unable to create incident.');setSaving(false)}
  }

  return <Card><CardContent>
    <Stepper activeStep={step} alternativeLabel sx={{mb:5}}>{steps.map(label=><Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
    {error?<Alert severity='error' sx={{mb:3}}>{error}</Alert>:null}

    {step===0?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
      <TextField select label='Incident Source' value={incidentSource} onChange={e=>{setIncidentSource(e.target.value);if(e.target.value!=='CAD')setCadMessageId('')}}><MenuItem value='MANUAL'>Manual</MenuItem><MenuItem value='CAD'>CAD Assisted</MenuItem></TextField>
      <TextField label='Incident Date' type='date' value={incidentDate} onChange={e=>setIncidentDate(e.target.value)} InputLabelProps={{shrink:true}}/>
      {incidentSource==='CAD'?<TextField select label='CAD Message' value={cadMessageId} onChange={e=>setCadMessageId(e.target.value)} sx={{gridColumn:{md:'1 / -1'}}><MenuItem value=''>Select CAD message</MenuItem>{cadMessages.map(row=><MenuItem key={row.id} value={row.id}>{row.sourceIncidentId||row.sourceMessageId||row.id} — {row.processingStatus}</MenuItem>)}</TextField>:null}
      <TextField label='Alarm Time' type='time' value={alarmAt} onChange={e=>setAlarmAt(e.target.value)} InputLabelProps={{shrink:true}}/>
      <TextField select label='Station' value={stationId} onChange={e=>setStationId(e.target.value)}><MenuItem value=''>Not assigned</MenuItem>{stations.map(x=><MenuItem key={x.id} value={x.id}>{x.name||x.stationNumber||x.id}</MenuItem>)}</TextField>
      <TextField select label='Shift' value={shiftId} onChange={e=>setShiftId(e.target.value)}><MenuItem value=''>Not assigned</MenuItem>{shifts.map(x=><MenuItem key={x.id} value={x.id}>{x.name||x.code||x.id}</MenuItem>)}</TextField>
      <TextField label='Primary Incident Type Code' value={incidentType} onChange={e=>setIncidentType(e.target.value)}/>
      <TextField label='Response District' value={responseDistrict} onChange={e=>setResponseDistrict(e.target.value)}/>
      <TextField multiline minRows={3} sx={{gridColumn:{md:'1 / -1'}}} label='Dispatch Description' value={dispatchDescription} onChange={e=>setDispatchDescription(e.target.value)}/>
    </Box>:null}

    {step===1?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
      <TextField select label='Primary Unit' value={unitId} onChange={e=>setUnitId(e.target.value)}><MenuItem value=''>No unit</MenuItem>{units.map(x=><MenuItem key={x.id} value={x.id}>{x.callSign||x.unitNumber||x.name||x.id} {x.unitType?`— ${x.unitType}`:''}</MenuItem>)}</TextField>
      <TextField label='Unit Role' value={unitRole} onChange={e=>setUnitRole(e.target.value)}/>
      <TextField select label='Incident Officer / Reporting Officer' value={officerId} onChange={e=>setOfficerId(e.target.value)} sx={{gridColumn:{md:'1 / -1'}}><MenuItem value=''>Not assigned</MenuItem>{personnel.map(x=><MenuItem key={x.id} value={x.id}>{x.displayName||x.personId||x.id} {x.rank?`— ${x.rank}`:''}</MenuItem>)}</TextField>
    </Box>:null}

    {step===2?<Box sx={{display:'grid',gap:3}}>
      <TextField multiline minRows={8} label='Initial Incident Narrative' value={narrative} onChange={e=>setNarrative(e.target.value)} placeholder='Dispatch, arrival conditions, command, assignments, tactical actions, water supply, search, ventilation, fire control, overhaul, disposition...'/>
      <Alert severity='info' variant='outlined'>Additional NERIS sections and specialty records are completed from the incident workspace after creation.</Alert>
      {incidentSource==='CAD'?<Alert severity='warning' variant='outlined'>CAD-assisted creation links the selected source incident and records CAD as the incident source. It does not invent location, unit, personnel, or classification values that were not actually provided by the connected CAD workflow.</Alert>:null}
    </Box>:null}

    {step===3?<Box><Typography variant='h5'>Create Incident Record</Typography><Typography color='text.secondary' sx={{mt:1,mb:3}}>This creates the incident, primary unit assignment, reporting officer assignment, and initial narrative through the same Forge data layer used by connected Forge Platform mode.</Typography><Alert severity='warning' variant='outlined'>Creating the record does not submit it for officer review or final NERIS processing. Validation and review occur in the incident workspace.</Alert></Box>:null}

    <Box sx={{display:'flex',justifyContent:'space-between',gap:2,mt:5}}>
      <Button disabled={step===0||saving} onClick={()=>setStep(v=>Math.max(0,v-1))}>Back</Button>
      {step<3?<Button variant='contained' color='error' disabled={saving||(step===0&&incidentSource==='CAD'&&!cadMessageId)} onClick={()=>setStep(v=>Math.min(3,v+1))}>Continue</Button>:<Button variant='contained' color='error' disabled={saving} onClick={()=>void create()}>{saving?'Creating...':'Create Incident'}</Button>}
    </Box>
  </CardContent></Card>
}
