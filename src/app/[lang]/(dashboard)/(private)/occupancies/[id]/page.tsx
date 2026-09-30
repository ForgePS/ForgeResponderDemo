import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { notFound } from 'next/navigation'

import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import { getRmsMasterData } from '@/lib/forge-platform/rms'

type Occupancy = {
  id: string
  name?: string
  addressLine1?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  occupancyType?: string | null
  primaryContact?: string | null
  status?: string
  preplanId?: string | null
  sprinklered?: boolean
  fireAlarm?: boolean
  constructionType?: string | null
  knoxBox?: boolean
  notes?: string | null
}

export default async function OccupancyDetailPage({params}:{params:Promise<{lang:string,id:string}>}) {
  const {lang,id}=await params
  let result
  try {
    result=await getRmsMasterData<Occupancy>('occupancies',id)
  } catch {
    notFound()
  }
  const occupancy=result.data
  const address=occupancy.addressLine1 || occupancy.address || 'No address'

  return (
    <div>
      <Box sx={{mb:2}}><Button href={`/${lang}/occupancies`} startIcon={<i className='tabler-arrow-left'/>}>Occupancies</Button></Box>
      <PageHeader title={occupancy.name || occupancy.id} description={`${address} · ${occupancy.occupancyType || 'Occupancy type not recorded'}`} />

      <Alert severity={result.source==='platform'?'success':'info'} variant='outlined' sx={{mb:3}}>
        {result.source==='platform'?'Live Forge Platform occupancy record.':'Persistent standalone demo occupancy record.'}
      </Alert>

      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
        <StatCard label='Status' value={occupancy.status || 'ACTIVE'} detail='Occupancy state' icon='tabler-building-check' color='success'/>
        <StatCard label='Preplan' value={occupancy.preplanId?'Linked':'Not Linked'} detail='Responder planning linkage' icon='tabler-map-2' color={occupancy.preplanId?'success':'warning'}/>
        <StatCard label='Sprinkler' value={occupancy.sprinklered===undefined?'—':occupancy.sprinklered?'Yes':'No'} detail='Legacy/demo protection field' icon='tabler-sprinkler' color='info'/>
        <StatCard label='Fire Alarm' value={occupancy.fireAlarm===undefined?'—':occupancy.fireAlarm?'Yes':'No'} detail='Legacy/demo protection field' icon='tabler-bell' color='warning'/>
      </Box>

      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'1.25fr .75fr'},gap:3}}>
        <Card>
          <CardContent>
            <Typography variant='h5' sx={{mb:3}}>Building Intelligence</Typography>
            <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)'},gap:3}}>
              {[
                ['Occupancy Type',occupancy.occupancyType],
                ['Construction',occupancy.constructionType],
                ['Address',address],
                ['City / State / ZIP',[occupancy.city,occupancy.state,occupancy.postalCode].filter(Boolean).join(', ')],
                ['Knox Box',occupancy.knoxBox===undefined?null:occupancy.knoxBox?'Recorded':'Not recorded'],
                ['Primary Contact',occupancy.primaryContact],
                ['Notes',occupancy.notes]
              ].map(([label,value])=>(
                <Box key={String(label)}>
                  <Typography variant='caption' color='text.secondary'>{label}</Typography>
                  <Typography fontWeight={600}>{value || 'Not recorded'}</Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant='h5'>Responder / Prevention Actions</Typography>
            <Typography color='text.secondary' sx={{mt:1,mb:3}}>Operational paths linked to this occupancy.</Typography>
            <Box sx={{display:'grid',gap:2}}>
              <Button href={`/${lang}/inspections/new?occupancy=${occupancy.id}`} variant='contained' color='error' startIcon={<i className='tabler-clipboard-check'/>}>Start Inspection</Button>
              {occupancy.preplanId
                ? <Button href={`/${lang}/preplans/${occupancy.preplanId}`} variant='tonal' startIcon={<i className='tabler-map-2'/>}>Open Preplan</Button>
                : <Button href={`/${lang}/preplans/new?occupancy=${occupancy.id}`} variant='tonal' startIcon={<i className='tabler-map-plus'/>}>Create Preplan</Button>}
              <Button href={`/${lang}/hydrants`} variant='outlined' startIcon={<i className='tabler-droplet'/>}>View Water Supply</Button>
            </Box>
            <Divider sx={{my:3}}/>
            <Chip size='small' variant='tonal' color={result.source==='platform'?'success':'info'} label={result.source==='platform'?'Forge Platform':'Demo Persistence'}/>
          </CardContent>
        </Card>
      </Box>
    </div>
  )
}
