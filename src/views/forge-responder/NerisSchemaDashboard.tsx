'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { humanizeNerisName, type NerisModule } from '@/utils/nerisSchema'

export default function NerisSchemaDashboard({modules,lang}:{modules:NerisModule[];lang:string}) {
  const [query,setQuery]=useState('')
  const [group,setGroup]=useState('all')
  const [workbook,setWorkbook]=useState('all')
  const workbooks=useMemo(()=>Array.from(new Set(modules.map(m=>m.workbook))).sort(),[modules])

  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase()
    return modules.filter(module=>{
      const text=`${module.module} ${humanizeNerisName(module.module)} ${module.workbook} ${module.group}`.toLowerCase()
      return (!q || text.includes(q)) && (group==='all' || module.group===group) && (workbook==='all' || module.workbook===workbook)
    })
  },[modules,query,group,workbook])

  return (
    <div>
      <Card sx={{mb:3}}>
        <CardContent>
          <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'2fr 1fr 1fr'},gap:2}}>
            <TextField value={query} onChange={e=>setQuery(e.target.value)} label='Search NERIS modules' placeholder='Structure fire, dispatch, medical...' />
            <TextField select value={group} onChange={e=>setGroup(e.target.value)} label='Schema Group'>
              <MenuItem value='all'>All Groups</MenuItem><MenuItem value='core'>Core</MenuItem><MenuItem value='secondary'>Secondary</MenuItem>
            </TextField>
            <TextField select value={workbook} onChange={e=>setWorkbook(e.target.value)} label='Workbook'>
              <MenuItem value='all'>All Workbooks</MenuItem>
              {workbooks.map(item=><MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(2,1fr)',xl:'repeat(3,1fr)'},gap:3}}>
        {filtered.map(module=>{
          const conditional=module.fields.filter(f=>Boolean(f.possible_if)).length
          const computed=module.fields.filter(f=>Boolean(f.computed)).length
          const valueSets=module.fields.filter(f=>Boolean(f.value_set)).length
          return (
            <Card key={module.module}>
              <CardContent sx={{height:'100%',display:'flex',flexDirection:'column'}}>
                <Box sx={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:2}}>
                  <div>
                    <Typography variant='h5'>{humanizeNerisName(module.module)}</Typography>
                    <Typography variant='caption' color='text.secondary'>{module.module}</Typography>
                  </div>
                  <Chip size='small' variant='tonal' color={module.group==='core'?'error':'info'} label={module.group.toUpperCase()} />
                </Box>
                <Typography color='text.secondary' sx={{mt:2}}>{module.workbook}</Typography>
                <Box sx={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:1.5,my:3}}>
                  <div><Typography variant='caption' color='text.secondary'>Fields</Typography><Typography variant='h6'>{module.fieldCount}</Typography></div>
                  <div><Typography variant='caption' color='text.secondary'>Conditional</Typography><Typography variant='h6'>{conditional}</Typography></div>
                  <div><Typography variant='caption' color='text.secondary'>Computed</Typography><Typography variant='h6'>{computed}</Typography></div>
                  <div><Typography variant='caption' color='text.secondary'>Value Set Refs</Typography><Typography variant='h6'>{valueSets}</Typography></div>
                </Box>
                <Button component={Link} href={`/${lang}/neris/modules/${module.module}`} variant='tonal' color='error' endIcon={<i className='tabler-chevron-right'/>} sx={{mt:'auto'}}>Open Module Schema</Button>
              </CardContent>
            </Card>
          )
        })}
      </Box>
    </div>
  )
}
