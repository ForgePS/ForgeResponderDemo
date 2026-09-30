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
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

type Kind=
  | 'exposures'
  | 'civilian-casualties'
  | 'fire-service-casualties'
  | 'hazmat-substances'
  | 'hazmat-containers'
  | 'alarm-systems'
  | 'protection-systems'
  | 'attachments'

type Field={key:string;label:string;type?:'text'|'number'|'boolean'|'textarea';required?:boolean}

const configs:Record<Kind,{label:string;fields:Field[]}> = {
  exposures:{label:'Exposures',fields:[
    {key:'addressLine1',label:'Address'},
    {key:'city',label:'City'},
    {key:'state',label:'State'},
    {key:'propertyUse',label:'Property Use'},
    {key:'constructionDetails',label:'Construction Details',type:'textarea'},
    {key:'fireSpreadMechanism',label:'Fire Spread Mechanism'},
    {key:'damageDescription',label:'Damage Description',type:'textarea'},
    {key:'propertyLoss',label:'Property Loss',type:'number'},
    {key:'contentLoss',label:'Content Loss',type:'number'},
    {key:'narrative',label:'Exposure Narrative',type:'textarea'}
  ]},
  'civilian-casualties':{label:'Civilian Casualties',fields:[
    {key:'displayName',label:'Display Name'},
    {key:'age',label:'Age',type:'number'},
    {key:'sex',label:'Sex'},
    {key:'civilianRole',label:'Civilian Role'},
    {key:'injuryType',label:'Injury Type'},
    {key:'injurySeverity',label:'Injury Severity'},
    {key:'treatmentProvided',label:'Treatment Provided',type:'textarea'},
    {key:'transportStatus',label:'Transport Status'},
    {key:'outcome',label:'Outcome'},
    {key:'narrative',label:'Narrative',type:'textarea'}
  ]},
  'fire-service-casualties':{label:'Fire Service Casualties',fields:[
    {key:'personnelDisplayName',label:'Personnel Name'},
    {key:'rank',label:'Rank'},
    {key:'assignment',label:'Assignment'},
    {key:'incidentActivity',label:'Incident Activity'},
    {key:'injuryType',label:'Injury Type'},
    {key:'injurySeverity',label:'Injury Severity'},
    {key:'mayday',label:'Mayday',type:'boolean'},
    {key:'rapidIntervention',label:'Rapid Intervention',type:'boolean'},
    {key:'treatmentStatus',label:'Treatment Status'},
    {key:'narrative',label:'Narrative',type:'textarea'}
  ]},
  'hazmat-substances':{label:'Hazmat Substances',fields:[
    {key:'productName',label:'Product Name',required:true},
    {key:'unNaNumber',label:'UN/NA Number'},
    {key:'casNumber',label:'CAS Number'},
    {key:'hazardClass',label:'Hazard Class'},
    {key:'physicalState',label:'Physical State'},
    {key:'quantityReleased',label:'Quantity Released',type:'number'},
    {key:'unitOfMeasure',label:'Unit of Measure'},
    {key:'releaseStatus',label:'Release Status'},
    {key:'environmentalImpact',label:'Environmental Impact',type:'textarea'},
    {key:'narrative',label:'Narrative',type:'textarea'}
  ]},
  'hazmat-containers':{label:'Hazmat Containers',fields:[
    {key:'containerType',label:'Container Type',required:true},
    {key:'productName',label:'Product Name'},
    {key:'capacity',label:'Capacity',type:'number'},
    {key:'capacityUnit',label:'Capacity Unit'},
    {key:'damage',label:'Damage',type:'textarea'},
    {key:'leakLocation',label:'Leak Location'},
    {key:'pressureStatus',label:'Pressure Status'},
    {key:'controlAction',label:'Control Action',type:'textarea'},
    {key:'recoveryStatus',label:'Recovery Status'},
    {key:'narrative',label:'Narrative',type:'textarea'}
  ]},
  'alarm-systems':{label:'Alarm Systems',fields:[
    {key:'systemType',label:'System Type'},
    {key:'deviceType',label:'Device Type'},
    {key:'location',label:'Location'},
    {key:'presence',label:'Presence'},
    {key:'activation',label:'Activation'},
    {key:'operation',label:'Operation'},
    {key:'effectiveness',label:'Effectiveness'},
    {key:'impairment',label:'Impairment',type:'boolean'},
    {key:'failureReason',label:'Failure Reason',type:'textarea'},
    {key:'correctiveAction',label:'Corrective Action',type:'textarea'}
  ]},
  'protection-systems':{label:'Protection Systems',fields:[
    {key:'systemType',label:'System Type',required:true},
    {key:'location',label:'Location'},
    {key:'presence',label:'Presence'},
    {key:'activation',label:'Activation'},
    {key:'operation',label:'Operation'},
    {key:'effectiveness',label:'Effectiveness'},
    {key:'impairment',label:'Impairment',type:'boolean'},
    {key:'failureReason',label:'Failure Reason',type:'textarea'},
    {key:'contractor',label:'Contractor'},
    {key:'correctiveAction',label:'Corrective Action',type:'textarea'}
  ]},
  attachments:{label:'Attachments',fields:[]}
}

function summary(kind:Kind,row:Record<string,unknown>){
  if(kind==='exposures')return String(row.addressLine1||row.locationDescription||row.id)
  if(kind==='civilian-casualties')return String(row.displayName||row.civilianRole||row.id)
  if(kind==='fire-service-casualties')return String(row.personnelDisplayName||row.assignment||row.id)
  if(kind==='hazmat-substances')return String(row.productName||row.unNaNumber||row.id)
  if(kind==='hazmat-containers')return String(row.containerType||row.productName||row.id)
  if(kind==='alarm-systems'||kind==='protection-systems')return String(row.systemType||row.location||row.id)
  return String(row.originalFilename||row.caption||row.id)
}

export default function SpecialtyRecordsPanel({incidentId}:{incidentId:string}){
  const [kind,setKind]=useState<Kind>('exposures')
  const [rows,setRows]=useState<Record<string,unknown>[]>([])
  const [form,setForm]=useState<Record<string,unknown>>({})
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const [file,setFile]=useState<File|null>(null)
  const [category,setCategory]=useState('OTHER')
  const [caption,setCaption]=useState('')
  const [editingId,setEditingId]=useState<string|null>(null)
  const [editingVersion,setEditingVersion]=useState(1)

  const config=configs[kind]

  async function load(){
    setError('')
    try{
      const response=await fetch(`/api/incidents/${incidentId}/specialty/${kind}`,{cache:'no-store'})
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to load specialty records.')
      setRows(body.data||[])
    }catch(err){setError(err instanceof Error?err.message:'Unable to load specialty records.')}
  }

  useEffect(()=>{setForm({});setFile(null);setMessage('');setEditingId(null);setEditingVersion(1);void load()},[kind,incidentId])

  const activeRows=useMemo(()=>rows.filter(row=>String(row.status||'ACTIVE')!=='ARCHIVED'),[rows])

  function startEdit(row:Record<string,unknown>){
    if(kind==='attachments')return
    const next:Record<string,unknown>={}
    for(const field of config.fields)next[field.key]=row[field.key] ?? ''
    setForm(next)
    setEditingId(String(row.id))
    setEditingVersion(Number(row.recordVersion||1))
    window.scrollTo({top:0,behavior:'smooth'})
  }

  function cancelEdit(){
    setForm({})
    setEditingId(null)
    setEditingVersion(1)
  }

  async function create(){
    setBusy(true);setError('');setMessage('')
    try{
      if(kind==='attachments'){
        if(!file)throw new Error('Choose a file to upload.')
        const data=new FormData()
        data.set('file',file)
        data.set('category',category)
        data.set('caption',caption)
        data.set('securityClassification','INTERNAL')
        const response=await fetch(`/api/incidents/${incidentId}/attachments/upload`,{method:'POST',body:data})
        const body=await response.json()
        if(!response.ok)throw new Error(body.error||'Unable to upload attachment.')
        setFile(null);setCaption('')
      }else{
        const payload=Object.fromEntries(Object.entries(form).filter(([,value])=>value!==''&&value!==null&&value!==undefined))
        const response=await fetch(`/api/incidents/${incidentId}/specialty/${kind}`,{
          method:editingId?'PATCH':'POST',
          headers:{'Content-Type':'application/json',...(editingId?{'x-record-version':String(editingVersion)}:{})},
          body:JSON.stringify(editingId?{id:editingId,...payload}:payload)
        })
        const body=await response.json()
        if(!response.ok)throw new Error(body.error||'Unable to create specialty record.')
        setForm({});setEditingId(null);setEditingVersion(1)
      }
      await load();setMessage(`${config.label.slice(0,-1)||config.label} record saved.`)
    }catch(err){setError(err instanceof Error?err.message:'Unable to save specialty record.')}
    finally{setBusy(false)}
  }

  async function archive(id:string){
    setBusy(true);setError('');setMessage('')
    try{
      const response=await fetch(`/api/incidents/${incidentId}/specialty/${kind}/${id}/archive`,{method:'POST'})
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to archive record.')
      await load();setMessage('Record archived.')
    }catch(err){setError(err instanceof Error?err.message:'Unable to archive record.')}
    finally{setBusy(false)}
  }

  return <Box sx={{display:'grid',gap:3}}>
    {error?<Alert severity='error'>{error}</Alert>:null}
    {message?<Alert severity='success'>{message}</Alert>:null}

    <Card variant='outlined'><CardContent>
      <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'center',flexWrap:'wrap'}}>
        <Box><Typography variant='h5'>Specialty & Repeatable Records</Typography><Typography color='text.secondary'>Incident-linked records for NERIS specialty workflows.</Typography></Box>
        <TextField select size='small' label='Record Type' value={kind} onChange={e=>setKind(e.target.value as Kind)} sx={{minWidth:260}}>
          {(Object.keys(configs) as Kind[]).map(key=><MenuItem key={key} value={key}>{configs[key].label}</MenuItem>)}
        </TextField>
      </Box>
    </CardContent></Card>

    <Card variant='outlined'><CardContent>
      <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:2,mb:3}}><Typography variant='h5'>{editingId?'Edit':'Add'} {config.label}</Typography>{editingId?<Button size='small' onClick={cancelEdit}>Cancel Edit</Button>:null}</Box>
      {kind==='attachments'?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
        <TextField select label='Category' value={category} onChange={e=>setCategory(e.target.value)}>
          {['SCENE_PHOTO','FIRE_PHOTO','HAZMAT_PHOTO','RESCUE_PHOTO','EXPLOSION_PHOTO','EXPOSURE_PHOTO','ALARM_DOCUMENT','FIRE_PROTECTION_DOCUMENT','INVESTIGATION_REFERRAL','SKETCH','FLOOR_PLAN','PDF','OTHER'].map(value=><MenuItem key={value} value={value}>{value.replaceAll('_',' ')}</MenuItem>)}
        </TextField>
        <TextField label='Caption' value={caption} onChange={e=>setCaption(e.target.value)}/>
        <Button component='label' variant='outlined' sx={{gridColumn:{md:'1 / -1'}}}>Choose File<input hidden type='file' accept='image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif,application/pdf' onChange={e=>setFile(e.target.files?.[0]||null)}/></Button>
        {file?<Typography sx={{gridColumn:{md:'1 / -1'}}}>{file.name} · {Math.round(file.size/1024)} KB</Typography>:null}
      </Box>:<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(2,1fr)'},gap:3}}>
        {config.fields.map(field=>field.type==='boolean'
          ? <TextField key={field.key} select label={field.label} value={String(form[field.key]??'')} onChange={e=>setForm(v=>({...v,[field.key]:e.target.value==='true'}))}><MenuItem value=''>Not recorded</MenuItem><MenuItem value='true'>Yes</MenuItem><MenuItem value='false'>No</MenuItem></TextField>
          : <TextField key={field.key} required={field.required} type={field.type==='number'?'number':'text'} multiline={field.type==='textarea'} minRows={field.type==='textarea'?3:undefined} label={field.label} value={String(form[field.key]??'')} onChange={e=>setForm(v=>({...v,[field.key]:field.type==='number'&&e.target.value!==''?Number(e.target.value):e.target.value}))}/>)}
      </Box>}
      <Box sx={{display:'flex',justifyContent:'flex-end',mt:3}}><Button variant='contained' color='error' disabled={busy} onClick={()=>void create()}>{busy?'Saving…':kind==='attachments'?'Upload Attachment':editingId?'Save Changes':`Add ${config.label.slice(0,-1)}`}</Button></Box>
    </CardContent></Card>

    <Card variant='outlined'><CardContent>
      <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:2}}><Typography variant='h5'>{config.label}</Typography><Chip label={activeRows.length} variant='tonal'/></Box>
      <Divider sx={{mb:2}}/>
      <Box sx={{display:'grid',gap:2}}>
        {activeRows.map((row:any)=><Box key={String(row.id)} sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:2,p:2,border:'1px solid',borderColor:'divider',borderRadius:2}}>
          <Box>
            <Typography fontWeight={700}>{summary(kind,row)}</Typography>
            <Typography variant='caption' color='text.secondary'>{row.createdAt?new Date(String(row.createdAt)).toLocaleString():'Created time not returned'}{row.uploadStatus?` · ${row.uploadStatus}`:''}{row.malwareScanStatus?` · Scan: ${row.malwareScanStatus}`:''}</Typography>
          </Box>
          <Box sx={{display:'flex',gap:1}}>{kind!=='attachments'?<Button size='small' disabled={busy} onClick={()=>startEdit(row)}>Edit</Button>:null}<Button size='small' color='error' disabled={busy} onClick={()=>void archive(String(row.id))}>Archive</Button></Box>
        </Box>)}
        {!activeRows.length?<Typography color='text.secondary'>No active {config.label.toLowerCase()} records.</Typography>:null}
      </Box>
    </CardContent></Card>
  </Box>
}
