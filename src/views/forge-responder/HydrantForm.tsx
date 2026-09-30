'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'

type Hydrant = Record<string, unknown> & { id?: string; recordVersion?: number }

export default function HydrantForm({ hydrant, lang }: { hydrant?: Hydrant; lang: string }) {
  const router = useRouter()
  const [form, setForm] = useState<Record<string,string>>({
    displayId: String(hydrant?.displayId ?? ''),
    address: String(hydrant?.address ?? ''),
    district: String(hydrant?.district ?? ''),
    provider: String(hydrant?.provider ?? ''),
    waterAssoc: String(hydrant?.waterAssoc ?? ''),
    status: String(hydrant?.status ?? 'In Service'),
    latitude: String(hydrant?.latitude ?? ''),
    longitude: String(hydrant?.longitude ?? ''),
    dischargeSize: String(hydrant?.dischargeSize ?? ''),
    subdivision: String(hydrant?.subdivision ?? '')
  })
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')

  async function remove(){
    if(!hydrant?.id||!window.confirm('Delete this hydrant?')) return
    setSaving(true);setError('')
    try{
      const response=await fetch(`/api/hydrants/${hydrant.id}`,{method:'DELETE',headers:{'x-record-version':String(hydrant.recordVersion||1)}})
      const body=await response.json(); if(!response.ok) throw new Error(body.error||'Unable to delete hydrant.')
      router.push(`/${lang}/hydrants`);router.refresh()
    }catch(err){setError(err instanceof Error?err.message:'Unable to delete hydrant.');setSaving(false)}
  }

  async function save(){
    setSaving(true);setError('')
    try{
      const payload:Record<string,unknown>={}
      for(const [key,value] of Object.entries(form)){
        if(value.trim()==='') continue
        payload[key]=(key==='latitude'||key==='longitude')?Number(value):value.trim()
      }
      const editing=Boolean(hydrant?.id)
      const response=await fetch(editing?`/api/hydrants/${hydrant!.id}`:'/api/hydrants',{
        method:editing?'PATCH':'POST',
        headers:{
          'Content-Type':'application/json',
          ...(editing?{'x-record-version':String(hydrant?.recordVersion||1)}:{})
        },
        body:JSON.stringify(payload)
      })
      const body=await response.json()
      if(!response.ok) throw new Error(body.error||'Unable to save hydrant.')
      router.push(`/${lang}/hydrants/${body.data.id}`)
      router.refresh()
    }catch(err){
      setError(err instanceof Error?err.message:'Unable to save hydrant.')
      setSaving(false)
    }
  }

  return <Card><CardContent>
    {error?<Alert severity='error' sx={{mb:3}}>{error}</Alert>:null}
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'1fr 1fr'},gap:3}}>
      <TextField label='Hydrant ID / Number' value={form.displayId} onChange={e=>setForm(v=>({...v,displayId:e.target.value}))}/>
      <TextField select label='Operational Status' value={form.status} onChange={e=>setForm(v=>({...v,status:e.target.value}))}>
        <MenuItem value='In Service'>In Service</MenuItem><MenuItem value='Needs Repair'>Needs Repair</MenuItem><MenuItem value='Out of Service'>Out of Service</MenuItem>
      </TextField>
      <TextField label='Address' value={form.address} onChange={e=>setForm(v=>({...v,address:e.target.value}))}/>
      <TextField label='District' value={form.district} onChange={e=>setForm(v=>({...v,district:e.target.value}))}/>
      <TextField label='Water Provider' value={form.provider} onChange={e=>setForm(v=>({...v,provider:e.target.value}))}/>
      <TextField label='Water Association' value={form.waterAssoc} onChange={e=>setForm(v=>({...v,waterAssoc:e.target.value}))}/>
      <TextField label='Subdivision' value={form.subdivision} onChange={e=>setForm(v=>({...v,subdivision:e.target.value}))}/>
      <TextField label='Discharge Size' value={form.dischargeSize} onChange={e=>setForm(v=>({...v,dischargeSize:e.target.value}))}/>
      <TextField label='Latitude' type='number' value={form.latitude} onChange={e=>setForm(v=>({...v,latitude:e.target.value}))}/>
      <TextField label='Longitude' type='number' value={form.longitude} onChange={e=>setForm(v=>({...v,longitude:e.target.value}))}/>
    </Box>
    <Box sx={{display:'flex',justifyContent:'flex-end',gap:2,mt:4}}>
      {hydrant?.id?<Button color='error' disabled={saving} onClick={()=>void remove()}>Delete</Button>:null}<Button href={`/${lang}/hydrants`}>Cancel</Button>
      <Button variant='contained' color='error' disabled={saving} onClick={()=>void save()}>{saving?'Saving...':hydrant?.id?'Save Changes':'Create Hydrant'}</Button>
    </Box>
  </CardContent></Card>
}
