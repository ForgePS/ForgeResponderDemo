'use client'

import { useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

type FieldValueState={
  valueText?:string|null
  valueNumber?:number|null
  valueBoolean?:boolean|null
  valueTimestamp?:string|null
  valueOptionId?:string|null
  valueJson?:unknown
  prefillSource?:string|null
  userConfirmed?:boolean
}

type Field={
  fieldId:string
  fieldKey:string
  definition:string
  dataType:string|null
  required:boolean
  displayLabel:string
  helpText?:string|null
  displayOrder:number
  visible:boolean
  valueSetLocation?:string|null
}

type Module={
  moduleKey:string
  name:string
  sectionKey:string
  visible:boolean
  fields:Field[]
}

type Specialty={
  id:string
  sectionKey:string
  label:string
  plainLanguageSummary:string
  state:'HIDDEN'|'OPTIONAL'|'REQUIRED'|'ACTIVE'|'NOT_APPLICABLE'
  allowNotApplicable:boolean
  completionPercent?:number
  requiredFieldCount?:number
  filledRequiredFieldCount?:number
  hasBlockingGaps?:boolean
}

type Descriptor={
  schemaVersionId:string|null
  operatingMode:string
  sections:string[]
  navigationSections?:string[]
  specialtyWorkflows?:Specialty[]
  availableSpecialtySections?:Array<{sectionKey:string;label:string;summary:string}>
  modules:Module[]
}

type ValueOption={id:string;label:string;subtitle?:string}

const CORE_DYNAMIC=['DISPATCH','LOCATION','UNITS_PERSONNEL','CLASSIFICATION']

function sectionLabel(value:string){
  return value.toLowerCase().split('_').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ')
}

function fieldValue(field:Field,state:FieldValueState|undefined){
  const type=(field.dataType||'').toLowerCase()
  if(type.includes('boolean')) return Boolean(state?.valueBoolean)
  if(type.includes('integer')||type.includes('number')||type.includes('decimal')) return state?.valueNumber ?? ''
  if(field.valueSetLocation) return state?.valueOptionId ?? ''
  if(type.includes('datetime')) return state?.valueTimestamp ? String(state.valueTimestamp).slice(0,16) : ''
  if(Array.isArray(state?.valueJson)) return state.valueJson.join(', ')
  return state?.valueText ?? ''
}

function toFieldState(field:Field,value:unknown):FieldValueState{
  const type=(field.dataType||'').toLowerCase()
  if(type.includes('boolean')) return {valueBoolean:Boolean(value)}
  if(type.includes('integer')||type.includes('number')||type.includes('decimal')){
    return {valueNumber:value===''||value===null?null:Number(value)}
  }
  if(field.valueSetLocation) return {valueOptionId:value?String(value):null}
  if(type.includes('datetime')){
    return {valueTimestamp:value?new Date(String(value)).toISOString():null}
  }
  if(type.includes('array')){
    const values=String(value||'').split(',').map(x=>x.trim()).filter(Boolean)
    return {valueJson:values}
  }
  return {valueText:value?String(value):null}
}

export default function NerisDynamicForm({
  incidentId,
  recordVersion,
  onRecordVersion
}:{
  incidentId:string
  recordVersion:number
  onRecordVersion:(version:number)=>void
}){
  const [descriptor,setDescriptor]=useState<Descriptor|null>(null)
  const [values,setValues]=useState<Record<string,FieldValueState>>({})
  const [drafts,setDrafts]=useState<Record<string,unknown>>({})
  const [options,setOptions]=useState<Record<string,ValueOption[]>>({})
  const [activeSection,setActiveSection]=useState('CLASSIFICATION')
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const [rehydrationWarning,setRehydrationWarning]=useState('')

  async function loadDescriptor(){
    setLoading(true);setError('')
    try{
      const [descriptorResponse,valuesResponse]=await Promise.all([
        fetch(`/api/incidents/${incidentId}/form-descriptor`,{cache:'no-store'}),
        fetch(`/api/incidents/${incidentId}/field-values`,{cache:'no-store'})
      ])
      const descriptorBody=await descriptorResponse.json()
      const valuesBody=await valuesResponse.json()
      if(!descriptorResponse.ok)throw new Error(descriptorBody.error||'Unable to load NERIS form.')
      setDescriptor(descriptorBody.data)
      if(valuesResponse.ok){
        setValues(valuesBody.data||{})
        setRehydrationWarning('')
      }else if(valuesResponse.status===404||valuesResponse.status===405){
        setValues({})
        setRehydrationWarning('Saved field-value rehydration is not available on this Forge Platform deployment yet. The form remains usable, but previously stored connected-mode values cannot be displayed until the field-value read contract is deployed.')
      }else{
        throw new Error(valuesBody.error||'Unable to load saved NERIS field values.')
      }
      const nav=(descriptorBody.data.navigationSections||descriptorBody.data.sections||[]).filter((x:string)=>CORE_DYNAMIC.includes(x)||!['OVERVIEW','NARRATIVE','ATTACHMENTS','REVIEW'].includes(x))
      if(!nav.includes(activeSection)&&nav.length)setActiveSection(nav[0])
    }catch(err){setError(err instanceof Error?err.message:'Unable to load NERIS form.')}
    finally{setLoading(false)}
  }

  useEffect(()=>{void loadDescriptor()},[incidentId])

  const sections=useMemo(()=>{
    if(!descriptor)return []
    return (descriptor.navigationSections||descriptor.sections||[]).filter(section=>CORE_DYNAMIC.includes(section)||!['OVERVIEW','NARRATIVE','ATTACHMENTS','REVIEW'].includes(section))
  },[descriptor])

  const activeModules=useMemo(()=>descriptor?.modules.filter(module=>module.visible&&module.sectionKey===activeSection)||[],[descriptor,activeSection])
  const activeFields=useMemo(()=>activeModules.flatMap(module=>module.fields).filter(field=>field.visible&&!String(field.dataType||'').toLowerCase().includes('module')).sort((a,b)=>a.displayOrder-b.displayOrder),[activeModules])
  const specialty=descriptor?.specialtyWorkflows?.find(item=>item.sectionKey===activeSection)
  const unconfirmedInSection=useMemo(()=>activeFields.filter(field=>{
    const state=values[field.fieldId]
    return Boolean(state?.prefillSource&&state.prefillSource!=='MANUAL'&&state.userConfirmed===false)
  }).length,[activeFields,values])


  useEffect(()=>{
    const locations=[...new Set(activeFields.map(field=>field.valueSetLocation).filter(Boolean) as string[])]
    for(const location of locations){
      if(options[location])continue
      void fetch(`/api/neris/value-set-options?location=${encodeURIComponent(location)}`,{cache:'no-store'})
        .then(r=>r.json())
        .then(body=>setOptions(current=>({...current,[location]:body.data||[]})))
        .catch(()=>{})
    }
  },[activeSection,activeFields])

  function currentValue(field:Field){
    return drafts[field.fieldId] ?? fieldValue(field,values[field.fieldId])
  }

  async function saveSection(){
    const dirty=activeFields.filter(field=>Object.prototype.hasOwnProperty.call(drafts,field.fieldId))
    if(!dirty.length){setMessage('No field changes to save.');return}
    setSaving(true);setError('');setMessage('')
    try{
      const payload=dirty.map(field=>({
        fieldId:field.fieldId,
        fieldKey:field.fieldKey,
        sectionKey:activeSection,
        ...toFieldState(field,drafts[field.fieldId]),
        prefillSource:'MANUAL',
        userConfirmed:true
      }))
      const response=await fetch(`/api/incidents/${incidentId}/field-values`,{
        method:'PATCH',
        headers:{'Content-Type':'application/json','x-record-version':String(recordVersion)},
        body:JSON.stringify({values:payload})
      })
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to save NERIS section.')
      setValues(current=>{
        const next={...current}
        for(const item of payload){
          const {fieldId,fieldKey:_,sectionKey:__,...state}=item
          next[fieldId]=state
        }
        return next
      })
      setDrafts(current=>{
        const next={...current}
        for(const field of dirty)delete next[field.fieldId]
        return next
      })
      if(body.data?.incident?.recordVersion)onRecordVersion(Number(body.data.incident.recordVersion))
      setMessage(`${dirty.length} NERIS field${dirty.length===1?'':'s'} saved.`)
      await loadDescriptor()
    }catch(err){setError(err instanceof Error?err.message:'Unable to save NERIS section.')}
    finally{setSaving(false)}
  }

  async function specialtyAction(sectionKey:string,action:'ACTIVATE'|'MARK_NOT_APPLICABLE'|'CLEAR_NOT_APPLICABLE'){
    setSaving(true);setError('');setMessage('')
    try{
      const response=await fetch(`/api/incidents/${incidentId}/specialty-sections`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({sectionKey,action})
      })
      const body=await response.json()
      if(!response.ok)throw new Error(body.error||'Unable to update specialty section.')
      await loadDescriptor()
      if(action==='ACTIVATE')setActiveSection(sectionKey)
      setMessage('Specialty workflow updated.')
    }catch(err){setError(err instanceof Error?err.message:'Unable to update specialty section.')}
    finally{setSaving(false)}
  }

  if(loading&&!descriptor)return <Alert severity='info'>Loading NERIS schema-driven form…</Alert>
  if(!descriptor)return <Alert severity='error'>{error||'NERIS form descriptor is unavailable.'}</Alert>

  return <Box sx={{display:'grid',gap:3}}>
    {error?<Alert severity='error'>{error}</Alert>:null}
    {message?<Alert severity='success'>{message}</Alert>:null}
    {rehydrationWarning?<Alert severity='warning' variant='outlined'>{rehydrationWarning}</Alert>:null}

    <Card variant='outlined'>
      <CardContent>
        <Box sx={{display:'flex',justifyContent:'space-between',gap:2,flexWrap:'wrap',alignItems:'center'}}>
          <Box>
            <Typography variant='h5'>Schema-Driven NERIS Form</Typography>
            <Typography color='text.secondary'>Schema {descriptor.schemaVersionId||'not configured'} · {descriptor.operatingMode}</Typography>
          </Box>
          <Chip variant='tonal' color='info' label={`${descriptor.modules.length} visible modules`}/>
        </Box>

        {descriptor.availableSpecialtySections?.length?<Box sx={{mt:3}}>
          <Typography variant='subtitle1' sx={{mb:1}}>Available Specialty Workflows</Typography>
          <Box sx={{display:'flex',gap:1,flexWrap:'wrap'}}>
            {descriptor.availableSpecialtySections.map(item=><Button key={item.sectionKey} size='small' variant='outlined' disabled={saving} onClick={()=>void specialtyAction(item.sectionKey,'ACTIVATE')}>+ {item.label}</Button>)}
          </Box>
        </Box>:null}
      </CardContent>
    </Card>

    <Box sx={{display:'flex',gap:1,flexWrap:'wrap'}}>
      {sections.map(section=>{
        const group=descriptor.specialtyWorkflows?.find(item=>item.sectionKey===section)
        return <Button
          key={section}
          size='small'
          variant={activeSection===section?'contained':'tonal'}
          color={group?.hasBlockingGaps?'error':'primary'}
          onClick={()=>setActiveSection(section)}
        >
          {group?.label||sectionLabel(section)}{group?.completionPercent!==undefined?` · ${group.completionPercent}%`:''}
        </Button>
      })}
    </Box>

    {unconfirmedInSection>0?<Alert severity='warning' variant='outlined'>
      <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'center',flexWrap:'wrap'}}>
        <Box><Typography fontWeight={800}>Prefilled values require officer review</Typography><Typography variant='body2'>Review or edit each prefilled value in this section. Saving an edited field confirms it as a manual officer-entered value.</Typography></Box>
        <Chip color='warning' variant='tonal' label={String(unconfirmedInSection)+' unconfirmed'}/>
      </Box>
    </Alert>:null}

    {specialty?<Alert severity={specialty.state==='NOT_APPLICABLE'?'info':specialty.hasBlockingGaps?'warning':'success'} variant='outlined'>
      <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'center',flexWrap:'wrap'}}>
        <Box><Typography fontWeight={700}>{specialty.label}</Typography><Typography variant='body2'>{specialty.plainLanguageSummary}</Typography></Box>
        {specialty.allowNotApplicable?<Button size='small' onClick={()=>void specialtyAction(specialty.sectionKey,specialty.state==='NOT_APPLICABLE'?'CLEAR_NOT_APPLICABLE':'MARK_NOT_APPLICABLE')}>{specialty.state==='NOT_APPLICABLE'?'Restore Section':'Mark N/A'}</Button>:null}
      </Box>
    </Alert>:null}

    {specialty?.state==='NOT_APPLICABLE'?null:<Box sx={{display:'grid',gap:3}}>
      {activeModules.map(module=><Card key={module.moduleKey} variant='outlined'>
        <CardContent>
          <Typography variant='h5'>{module.name}</Typography>
          <Typography variant='caption' color='text.secondary'>{module.moduleKey}</Typography>
          <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(2,1fr)'},gap:3,mt:3}}>
            {module.fields.filter(field=>field.visible&&!String(field.dataType||'').toLowerCase().includes('module')).map(field=>{
              const type=(field.dataType||'').toLowerCase()
              const value=currentValue(field)
              const state=values[field.fieldId]
              const provenance=state?.prefillSource?`Source: ${state.prefillSource.replaceAll('_',' ')}`:null
              const confirmation=state?.prefillSource&&state.prefillSource!=='MANUAL'?(state.userConfirmed?'Confirmed':'Needs officer review'):null
              const helper=[field.required?'Required':null,field.helpText,provenance,confirmation].filter(Boolean).join(' · ')
              if(type.includes('boolean')){
                return <Box key={field.fieldId} sx={{p:1}}><FormControlLabel control={<Checkbox checked={Boolean(value)} onChange={e=>setDrafts(current=>({...current,[field.fieldId]:e.target.checked}))}/>} label={field.displayLabel}/><Typography variant='caption' color='text.secondary' display='block'>{helper}</Typography></Box>
              }
              if(field.valueSetLocation){
                return <TextField key={field.fieldId} select fullWidth required={field.required} label={field.displayLabel} value={String(value??'')} onChange={e=>setDrafts(current=>({...current,[field.fieldId]:e.target.value}))} helperText={helper}>
                  <MenuItem value=''>Not selected</MenuItem>
                  {(options[field.valueSetLocation]||[]).map(option=><MenuItem key={option.id} value={option.id}>{option.label}{option.subtitle?` — ${option.subtitle}`:''}</MenuItem>)}
                </TextField>
              }
              if(type.includes('boolean'))return null
              const numeric=type.includes('integer')||type.includes('number')||type.includes('decimal')
              const datetime=type.includes('datetime')
              const multiline=type.includes('array')||type.includes('text')
              return <TextField
                key={field.fieldId}
                fullWidth
                required={field.required}
                type={numeric?'number':datetime?'datetime-local':'text'}
                label={field.displayLabel}
                value={value as string|number}
                onChange={e=>setDrafts(current=>({...current,[field.fieldId]:e.target.value}))}
                helperText={helper}
                multiline={!datetime&&!numeric&&multiline}
                minRows={!datetime&&!numeric&&multiline?2:undefined}
                InputLabelProps={datetime?{shrink:true}:undefined}
              />
            })}
          </Box>
        </CardContent>
      </Card>)}
      {!activeModules.length?<Alert severity='info'>No visible NERIS modules are assigned to this section.</Alert>:null}
      <Box sx={{display:'flex',justifyContent:'flex-end'}}><Button variant='contained' color='error' disabled={saving} onClick={()=>void saveSection()}>{saving?'Saving…':'Save Section'}</Button></Box>
    </Box>}
  </Box>
}
