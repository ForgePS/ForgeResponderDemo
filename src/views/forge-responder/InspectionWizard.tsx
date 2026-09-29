'use client'

import { useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

const steps=['Setup','Checklist','Findings','Closeout']

export default function InspectionWizard({occupancies,types,templates}:{occupancies:any[];types:any[];templates:any[]}) {
  const [step,setStep]=useState(0)
  const [typeId,setTypeId]=useState(types[0]?.id || '')
  const [saved,setSaved]=useState(false)
  const selectedType=types.find(x=>x.id===typeId)
  const selectedTemplate=useMemo(()=>{
    if(!selectedType) return templates[0]
    const needle=String(selectedType.name||'').toLowerCase().replace(' inspection','')
    return templates.find(x=>String(x.name||'').toLowerCase().includes(needle)) || templates[0]
  },[typeId,selectedType,templates])
  const fields=(selectedTemplate?.sections || []).flatMap((section:any)=>section.fields || []).slice(0,8)

  const save=()=>{
    const event={type:'inspection-complete',title:`Demo inspection completed: ${selectedType?.name || 'Inspection'}`,occurredAt:new Date().toISOString()}
    const key='forge-responder-theme-demo-events'
    const current=JSON.parse(localStorage.getItem(key)||'[]')
    localStorage.setItem(key,JSON.stringify([event,...current].slice(0,100)))
    setSaved(true)
  }

  return (
    <Card>
      <CardContent>
        <Stepper activeStep={step} alternativeLabel sx={{mb:5}}>
          {steps.map(label=><Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
        {saved ? <Alert severity='success' sx={{mb:3}}>Demo inspection saved locally. No source record was changed.</Alert> : null}

        {step===0 ? <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
          <TextField select label='Occupancy' defaultValue={occupancies[0]?.id || ''}>{occupancies.map(x=><MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>)}</TextField>
          <TextField select label='Inspection Program' value={typeId} onChange={e=>setTypeId(e.target.value)}>{types.map(x=><MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>)}</TextField>
          <TextField label='Inspector' defaultValue='Demo Inspector' />
          <TextField type='date' label='Inspection Date' InputLabelProps={{shrink:true}} />
        </Box> : null}

        {step===1 ? <Box sx={{display:'grid',gap:2}}>
          <Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:2,mb:1}}>
            <div><Typography variant='h5'>{selectedTemplate?.name || 'Inspection Checklist'}</Typography><Typography color='text.secondary'>Template-driven demo checklist</Typography></div>
            <Chip variant='tonal' label={`v${selectedTemplate?.version || 1}`}/>
          </Box>
          {fields.length ? fields.map((field:any)=><Box key={field.id || field.key} sx={{p:2,border:'1px solid',borderColor:'divider',borderRadius:2}}>
            <FormControlLabel control={<Checkbox defaultChecked/>} label={field.label || field.key}/>
            {field.helpText ? <Typography variant='caption' color='text.secondary' display='block'>{field.helpText}</Typography> : null}
          </Box>) : <Alert severity='info'>No checklist fields were available in the selected normalized template.</Alert>}
        </Box> : null}

        {step===2 ? <Box sx={{display:'grid',gap:3}}>
          <TextField select label='Overall Result' defaultValue='pass'><MenuItem value='pass'>Pass</MenuItem><MenuItem value='conditional'>Conditional / Corrections Needed</MenuItem><MenuItem value='fail'>Fail</MenuItem></TextField>
          <TextField multiline minRows={4} label='Findings / Corrective Actions' placeholder='Document deficiency, severity, correction, responsible party, and due date...' />
          <TextField label='Follow-up Date' type='date' InputLabelProps={{shrink:true}} />
        </Box> : null}

        {step===3 ? <Box>
          <Typography variant='h5'>Inspection Closeout</Typography>
          <Typography color='text.secondary' sx={{mt:1,mb:3}}>Review the checklist and findings, then save the result to the browser-local demo activity stream.</Typography>
          <Alert severity='info' variant='outlined'>This standalone trade-show workflow does not create an official inspection record, violation, invoice, email, or external notification.</Alert>
        </Box> : null}

        <Box sx={{display:'flex',justifyContent:'space-between',gap:2,mt:5}}>
          <Button disabled={step===0} onClick={()=>setStep(v=>Math.max(0,v-1))}>Back</Button>
          {step<steps.length-1 ? <Button variant='contained' color='error' onClick={()=>setStep(v=>Math.min(steps.length-1,v+1))}>Continue</Button> : <Button variant='contained' color='error' onClick={save}>Complete Demo Inspection</Button>}
        </Box>
      </CardContent>
    </Card>
  )
}
