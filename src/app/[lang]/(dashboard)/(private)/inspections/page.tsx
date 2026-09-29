import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import SourceBoundaryAlert from '@views/forge-responder/SourceBoundaryAlert'
import { loadForgeSeed } from '@/utils/forgeSeed'

export default async function InspectionsPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params
  const types=loadForgeSeed<any[]>('inspection-types')
  const templates=loadForgeSeed<any[]>('inspection-templates')
  const fees=loadForgeSeed<any[]>('inspection-fees')
  const active=types.filter(x=>x.active!==false).length

  return (
    <div>
      <PageHeader title='Inspections' description='Inspection programs, configurable forms, findings, corrections, and closeout workflows.' />
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
        <StatCard label='Inspection Programs' value={types.length} detail='Source-backed program records' icon='tabler-clipboard-check' color='error'/>
        <StatCard label='Active Programs' value={active} detail='Currently configured' icon='tabler-circle-check' color='success'/>
        <StatCard label='Templates' value={templates.length} detail='Source-backed form templates' icon='tabler-template' color='info'/>
        <StatCard label='Fee Schedules' value={fees.length} detail='Source-backed fee records' icon='tabler-receipt' color='warning'/>
      </Box>

      <Box sx={{display:'flex',justifyContent:'flex-end',mb:3}}>
        <Button href={`/${lang}/inspections/new`} variant='contained' color='error' startIcon={<i className='tabler-play'/>}>Start Demo Inspection</Button>
      </Box>

      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(2,1fr)'},gap:3,mb:3}}>
        {types.map(type=>{
          const template=templates.find(t=>String(t.name).toLowerCase().includes(String(type.name).toLowerCase().replace(' inspection','')))
          return <Card key={type.id}><CardContent>
            <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'flex-start'}}>
              <div><Typography variant='h5'>{type.name}</Typography><Typography color='text.secondary' sx={{mt:.5}}>{type.description || 'Inspection program'}</Typography></div>
              <Chip size='small' variant='tonal' color={type.active===false?'default':'success'} label={type.active===false?'Inactive':'Active'}/>
            </Box>
            <Box sx={{display:'flex',gap:1,flexWrap:'wrap',mt:3}}>
              <Chip size='small' variant='outlined' label={type.frequency || 'Frequency not set'}/>
              <Chip size='small' variant='outlined' label={template ? `Template v${template.version || 1}` : 'Template available separately'}/>
            </Box>
          </CardContent></Card>
        })}
      </Box>

      <SourceBoundaryAlert>
        The source package contains inspection programs, templates, and fee schedules, but no standalone historical completed-inspection collection. The interactive inspection run is therefore explicitly demo-only.
      </SourceBoundaryAlert>
    </div>
  )
}
