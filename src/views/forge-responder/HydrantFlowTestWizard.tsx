'use client'

import { useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

const steps=['Test Setup','Pressures','Flow Calculation','Classification','Review']

function classify(gpm:number){
  if(gpm>=1500) return {name:'Class AA',color:'Light Blue'}
  if(gpm>=1000) return {name:'Class A',color:'Green'}
  if(gpm>=500) return {name:'Class B',color:'Orange'}
  return {name:'Class C',color:'Red'}
}

export default function HydrantFlowTestWizard({hydrant}:{hydrant:any}) {
  const [step,setStep]=useState(0)
  const [staticPsi,setStaticPsi]=useState(70)
  const [residualPsi,setResidualPsi]=useState(50)
  const [pitotPsi,setPitotPsi]=useState(25)
  const [diameter,setDiameter]=useState(2.5)
  const [coefficient,setCoefficient]=useState(.9)
  const [saved,setSaved]=useState(false)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const [testDate,setTestDate]=useState(new Date().toISOString().slice(0,10))
  const [shift,setShift]=useState('A')
  const [testedBy,setTestedBy]=useState('Demo Operator')

  const measured=useMemo(()=>29.84*coefficient*Math.pow(diameter,2)*Math.sqrt(Math.max(0,pitotPsi)),[coefficient,diameter,pitotPsi])
  const available20=useMemo(()=>{
    if(staticPsi<=residualPsi || staticPsi<=20) return measured
    return measured*Math.pow((staticPsi-20)/(staticPsi-residualPsi),0.54)
  },[measured,staticPsi,residualPsi])
  const nfpa=classify(available20)

  const save=async()=>{
    setSaving(true);setError('')
    try{
      const response=await fetch(`/api/hydrants/${hydrant.id}/records/flow-tests`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({testDate,shift,testedBy,staticPsi,residualPsi,pitotPsi,outletDiameter:diameter,dischargeCoefficient:coefficient,measuredFlowGpm:Math.round(measured),flowGpm:Math.round(available20),nfpaClass:nfpa.name,nfpaColor:nfpa.color})})
      const body=await response.json(); if(!response.ok) throw new Error(body.error||'Unable to save flow test.')
      setSaved(true)
    }catch(err){setError(err instanceof Error?err.message:'Unable to save flow test.')}
    finally{setSaving(false)}
  }

  return <Card><CardContent>
    <Stepper activeStep={step} alternativeLabel sx={{mb:5}}>{steps.map(x=><Step key={x}><StepLabel>{x}</StepLabel></Step>)}</Stepper>
    {saved?<Alert severity='success' sx={{mb:3}}>Flow test saved. Hydrant flow summary and history were updated.</Alert>:null}{error?<Alert severity='error' sx={{mb:3}}>{error}</Alert>:null}

    {step===0?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
      <TextField label='Hydrant' value={hydrant.displayId||hydrant.id} disabled/><TextField label='Address' value={hydrant.address||''} disabled/>
      <TextField label='Test Date' type='date' value={testDate} onChange={e=>setTestDate(e.target.value)} InputLabelProps={{shrink:true}}/><TextField select label='Shift' value={shift} onChange={e=>setShift(e.target.value)}><MenuItem value='A'>A Shift</MenuItem><MenuItem value='B'>B Shift</MenuItem><MenuItem value='C'>C Shift</MenuItem></TextField>
      <TextField label='Tested By' value={testedBy} onChange={e=>setTestedBy(e.target.value)}/><TextField select label='Test Type' defaultValue='flow'><MenuItem value='flow'>Hydrant Flow Test</MenuItem><MenuItem value='capacity'>Capacity Verification</MenuItem></TextField>
    </Box>:null}

    {step===1?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(3,1fr)'},gap:3}}>
      <TextField label='Static PSI' type='number' value={staticPsi} onChange={e=>setStaticPsi(Number(e.target.value))}/>
      <TextField label='Residual PSI' type='number' value={residualPsi} onChange={e=>setResidualPsi(Number(e.target.value))}/>
      <TextField label='Pitot PSI' type='number' value={pitotPsi} onChange={e=>setPitotPsi(Number(e.target.value))}/>
      <TextField label='Outlet Diameter (in)' type='number' value={diameter} onChange={e=>setDiameter(Number(e.target.value))}/>
      <TextField select label='Discharge Coefficient' value={coefficient} onChange={e=>setCoefficient(Number(e.target.value))}>
        <MenuItem value={.9}>0.90 — Rounded outlet</MenuItem><MenuItem value={.8}>0.80 — Square outlet</MenuItem><MenuItem value={.7}>0.70 — Projecting outlet</MenuItem>
      </TextField>
      <TextField label='Pressure Drop' value={`${Math.max(0,staticPsi-residualPsi).toFixed(1)} PSI`} disabled/>
    </Box>:null}

    {step===2?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
      <Box sx={{p:3,border:'1px solid',borderColor:'divider',borderRadius:2}}>
        <Typography variant='caption' color='text.secondary'>Measured Discharge</Typography><Typography variant='h3'>{Math.round(measured)} GPM</Typography>
        <Typography variant='caption' color='text.secondary'>Q = 29.84 × c × d² × √p</Typography>
      </Box>
      <Box sx={{p:3,border:'1px solid',borderColor:'divider',borderRadius:2}}>
        <Typography variant='caption' color='text.secondary'>Projected Available Flow @ 20 PSI Residual</Typography><Typography variant='h3'>{Math.round(available20)} GPM</Typography>
        <Typography variant='caption' color='text.secondary'>Projected from static and residual test pressures</Typography>
      </Box>
      <Alert severity={staticPsi-residualPsi>=10?'success':'warning'} sx={{gridColumn:{md:'1 / -1'}}}>
        Pressure drop: {(staticPsi-residualPsi).toFixed(1)} PSI. Verify test conditions and local procedure before relying on calculated capacity.
      </Alert>
    </Box>:null}

    {step===3?<Box sx={{textAlign:'center',py:3}}>
      <Typography variant='caption' color='text.secondary'>Capacity Classification @ 20 PSI Residual</Typography>
      <Typography variant='h2' sx={{mt:1}}>{nfpa.name}</Typography>
      <Chip size='medium' variant='tonal' color={nfpa.name==='Class AA'?'info':nfpa.name==='Class A'?'success':nfpa.name==='Class B'?'warning':'error'} label={`${nfpa.color} · ${Math.round(available20)} GPM`} sx={{mt:2}}/>
      <Typography color='text.secondary' sx={{mt:3}}>AA ≥1500 · A 1000–1499 · B 500–999 · C &lt;500 GPM</Typography>
    </Box>:null}

    {step===4?<Box><Typography variant='h5'>Flow Test Review</Typography><Typography color='text.secondary' sx={{mt:1,mb:3}}>Review the pressure readings, outlet coefficient, calculated discharge, projected flow at 20 psi residual, and capacity classification.</Typography>
      <Alert severity='info' variant='outlined'>NFPA 291 is a recommended practice; local water authority and AHJ requirements govern the official test and marking process. This saved record remains a demo/department record unless your AHJ or water authority recognizes it as an official test.</Alert>
    </Box>:null}

    <Box sx={{display:'flex',justifyContent:'space-between',gap:2,mt:5}}>
      <Button disabled={step===0} onClick={()=>setStep(v=>Math.max(0,v-1))}>Back</Button>
      {step<4?<Button variant='contained' color='error' onClick={()=>setStep(v=>v+1)}>Continue</Button>:<Button variant='contained' color='error' disabled={saving} onClick={()=>void save()}>{saving?'Saving...':'Save Flow Test'}</Button>}
    </Box>
  </CardContent></Card>
}
