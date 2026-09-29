'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

export type SearchRecord={
  id:string
  module:string
  title:string
  subtitle:string
  status?:string
  keywords?:string[]
  href:string
}

const moduleIcon:Record<string,string>={
  Hydrant:'tabler-droplet',
  Personnel:'tabler-user',
  Apparatus:'tabler-truck',
  Occupancy:'tabler-building',
  Preplan:'tabler-map-2'
}

export default function OperationalSearch({records}:{records:SearchRecord[]}) {
  const [query,setQuery]=useState('')
  const [module,setModule]=useState('all')
  const [status,setStatus]=useState('all')

  const modules=useMemo(()=>Array.from(new Set(records.map(r=>r.module))).sort(),[records])
  const statuses=useMemo(()=>Array.from(new Set(records.map(r=>r.status).filter(Boolean) as string[])).sort(),[records])

  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase()
    return records.filter(record=>{
      const hay=[record.title,record.subtitle,record.module,record.status,...(record.keywords||[])].filter(Boolean).join(' ').toLowerCase()
      return (!q || hay.includes(q)) && (module==='all' || record.module===module) && (status==='all' || record.status===status)
    })
  },[records,query,module,status])

  return (
    <div>
      <Card sx={{mb:3}}>
        <CardContent>
          <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'2fr 1fr 1fr'},gap:2}}>
            <TextField
              value={query}
              onChange={e=>setQuery(e.target.value)}
              label='Search Forge Responder'
              placeholder='Hydrant ID, member, apparatus, occupancy, preplan...'
              InputProps={{startAdornment:<InputAdornment position='start'><i className='tabler-search'/></InputAdornment>}}
            />
            <TextField select label='Module' value={module} onChange={e=>setModule(e.target.value)}>
              <MenuItem value='all'>All Modules</MenuItem>
              {modules.map(item=><MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
            <TextField select label='Status' value={status} onChange={e=>setStatus(e.target.value)}>
              <MenuItem value='all'>All Statuses</MenuItem>
              {statuses.map(item=><MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
          </Box>
        </CardContent>
      </Card>

      <Typography variant='body2' color='text.secondary' sx={{mb:2}}>{filtered.length} matching records</Typography>

      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(2,1fr)',xl:'repeat(3,1fr)'},gap:2}}>
        {filtered.slice(0,120).map(record=>(
          <Card key={`${record.module}-${record.id}`}>
            <CardContent sx={{height:'100%',display:'flex',flexDirection:'column'}}>
              <Box sx={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:2}}>
                <Box sx={{display:'flex',gap:1.5,alignItems:'flex-start'}}>
                  <Box sx={{width:38,height:38,borderRadius:2,display:'grid',placeItems:'center',bgcolor:'error.lightOpacity',color:'error.main'}}>
                    <i className={moduleIcon[record.module] || 'tabler-database'} />
                  </Box>
                  <div>
                    <Typography variant='h6'>{record.title}</Typography>
                    <Typography variant='caption' color='text.secondary'>{record.module}</Typography>
                  </div>
                </Box>
                {record.status ? <Chip size='small' variant='tonal' label={record.status}/> : null}
              </Box>
              <Typography color='text.secondary' sx={{mt:2,mb:3}}>{record.subtitle}</Typography>
              <Button component={Link} href={record.href} variant='tonal' color='error' endIcon={<i className='tabler-arrow-right'/>} sx={{mt:'auto'}}>Open Record</Button>
            </CardContent>
          </Card>
        ))}
      </Box>

      {!filtered.length ? <Card><CardContent sx={{textAlign:'center',py:6}}><i className='tabler-search-off text-4xl'/><Typography variant='h6' sx={{mt:2}}>No matching records</Typography><Typography color='text.secondary'>Try a broader search or clear the filters.</Typography></CardContent></Card> : null}
    </div>
  )
}
