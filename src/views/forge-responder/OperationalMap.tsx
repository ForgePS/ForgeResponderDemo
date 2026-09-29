'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Typography from '@mui/material/Typography'

type MapRow={id:string;type:'Hydrant'|'Occupancy'|'Apparatus';label:string;detail:string;href:string;lat?:number;lon?:number;status?:string}

export default function OperationalMap({records}:{records:MapRow[]}) {
  const [layers,setLayers]=useState<Record<string,boolean>>({Hydrant:true,Occupancy:true,Apparatus:true})
  const [selected,setSelected]=useState<MapRow|null>(null)
  const visible=useMemo(()=>records.filter(r=>layers[r.type]),[records,layers])

  return <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'280px 1fr'},gap:3}}>
    <Card><CardContent>
      <Typography variant='h5'>Map Layers</Typography>
      <Box sx={{display:'grid',mt:2}}>{Object.keys(layers).map(name=><FormControlLabel key={name} control={<Checkbox checked={layers[name]} onChange={e=>setLayers(cur=>({...cur,[name]:e.target.checked}))}/>} label={name}/>)}</Box>
      <Typography variant='caption' color='text.secondary'>{visible.length} visible records</Typography>
      {selected?<Box sx={{mt:3,p:2,border:'1px solid',borderColor:'divider',borderRadius:2}}>
        <Typography variant='caption' color='text.secondary'>{selected.type}</Typography>
        <Typography variant='h6'>{selected.label}</Typography>
        <Typography color='text.secondary' sx={{mt:.5}}>{selected.detail}</Typography>
        <Button component={Link} href={selected.href} fullWidth variant='contained' color='error' sx={{mt:2}}>Open Record</Button>
      </Box>:null}
    </CardContent></Card>

    <Card sx={{minHeight:600,position:'relative',overflow:'hidden',background:'linear-gradient(135deg,#121820,#1d2731)'}}>
      <Box sx={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)',backgroundSize:'40px 40px'}}/>
      {visible.slice(0,220).map((row,index)=>{
        const left=5+((index*37)%90), top=7+((index*23)%84)
        const color=row.type==='Hydrant'?'#42a5f5':row.type==='Occupancy'?'#ffb74d':'#66bb6a'
        return <button key={`${row.type}-${row.id}`} onClick={()=>setSelected(row)} title={`${row.type}: ${row.label}`} style={{position:'absolute',left:`${left}%`,top:`${top}%`,width:14,height:14,borderRadius:'50%',border:'2px solid #111',background:color,cursor:'pointer',zIndex:2}}/>
      })}
    </Card>
  </Box>
}
