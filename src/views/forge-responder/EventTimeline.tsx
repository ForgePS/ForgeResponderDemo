'use client'

import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

type EventRow={
  id:string
  type:string
  title:string
  detail?:string
  actor?:string
  status?:string
  occurredAt?:string
}

export default function EventTimeline({rows}:{rows:EventRow[]}) {
  const [query,setQuery]=useState('')
  const [type,setType]=useState('all')
  const types=useMemo(()=>Array.from(new Set(rows.map(r=>r.type).filter(Boolean))).sort(),[rows])

  const filtered=useMemo(()=>{
    const q=query.toLowerCase().trim()
    return rows.filter(row=>{
      const text=[row.type,row.title,row.detail,row.actor,row.status,row.occurredAt].filter(Boolean).join(' ').toLowerCase()
      return (!q || text.includes(q)) && (type==='all' || row.type===type)
    })
  },[rows,query,type])

  return (
    <div>
      <Card sx={{mb:3}}>
        <CardContent>
          <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'2fr 1fr'},gap:2}}>
            <TextField label='Search timeline' value={query} onChange={e=>setQuery(e.target.value)} />
            <TextField select label='Event Type' value={type} onChange={e=>setType(e.target.value)}>
              <MenuItem value='all'>All Event Types</MenuItem>
              {types.map(item=><MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{display:'grid',gap:2}}>
        {filtered.slice(0,150).map(row=>(
          <Card key={row.id}>
            <CardContent>
              <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'flex-start',flexWrap:'wrap'}}>
                <Box>
                  <Chip size='small' variant='tonal' label={row.type}/>
                  <Typography variant='h6' sx={{mt:1}}>{row.title}</Typography>
                  {row.detail ? <Typography color='text.secondary' sx={{mt:.5}}>{row.detail}</Typography> : null}
                </Box>
                <Typography variant='caption' color='text.secondary'>{row.occurredAt || '—'}</Typography>
              </Box>
              <Box sx={{display:'flex',gap:2,flexWrap:'wrap',mt:2}}>
                {row.actor ? <Typography variant='caption' color='text.secondary'>Actor: {row.actor}</Typography> : null}
                {row.status ? <Typography variant='caption' color='text.secondary'>Status: {row.status}</Typography> : null}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </div>
  )
}
