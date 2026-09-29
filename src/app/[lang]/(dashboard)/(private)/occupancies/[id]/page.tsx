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
import { loadForgeSeed } from '@/utils/forgeSeed'

export default async function OccupancyDetailPage({params}:{params:Promise<{lang:string,id:string}>}) {
  const {lang,id}=await params
  const rows=loadForgeSeed<any[]>('occupancies')
  const occupancy=rows.find(row=>row.id===id)
  if(!occupancy) notFound()

  const links=loadForgeSeed<any>('demo-navigation-links')
  const suggestedPreplan=links.occupancySuggestedPreplan?.find((x:any)=>x.occupancyId===id)
  const suggestedInspectionIds=links.occupancySuggestedInspectionType?.filter((x:any)=>x.occupancyId===id).map((x:any)=>x.inspectionTypeId) || []
  const inspectionTypes=loadForgeSeed<any[]>('inspection-types').filter(x=>suggestedInspectionIds.includes(x.id))
  const preplans=loadForgeSeed<any[]>('preplans')
  const preplan=suggestedPreplan ? preplans.find(x=>x.id===suggestedPreplan.preplanId) : null

  return (
    <div>
      <Box sx={{mb:2}}><Button href={`/${lang}/occupancies`} startIcon={<i className='tabler-arrow-left'/>}>Occupancies</Button></Box>
      <PageHeader title={occupancy.name} description={`${occupancy.address || 'No address'} · ${occupancy.occupancyType || 'Occupancy type not recorded'}`} />

      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
        <StatCard label='Status' value={occupancy.status || 'Active'} detail='Source occupancy state' icon='tabler-building-check' color='success'/>
        <StatCard label='Sprinkler' value={occupancy.sprinklered?'Yes':'No'} detail='Source protection field' icon='tabler-sprinkler' color={occupancy.sprinklered?'success':'warning'}/>
        <StatCard label='Fire Alarm' value={occupancy.fireAlarm?'Yes':'No'} detail='Source protection field' icon='tabler-bell' color={occupancy.fireAlarm?'info':'warning'}/>
        <StatCard label='Inspection Programs' value={inspectionTypes.length} detail='Demo navigation suggestions' icon='tabler-clipboard-check' color='error'/>
      </Box>

      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'1.25fr .75fr'},gap:3}}>
        <Card>
          <CardContent>
            <Typography variant='h5' sx={{mb:3}}>Building Intelligence</Typography>
            <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)'},gap:3}}>
              {[
                ['Occupancy Type',occupancy.occupancyType],
                ['Construction',occupancy.constructionType],
                ['Address',occupancy.address],
                ['City / State',[occupancy.city,occupancy.state].filter(Boolean).join(', ')],
                ['Knox Box',occupancy.knoxBox?'Recorded':'Not recorded'],
                ['Primary Contact',occupancy.primaryContactName],
                ['Phone',occupancy.primaryContactPhone],
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
            <Typography variant='h5'>Prevention Actions</Typography>
            <Typography color='text.secondary' sx={{mt:1,mb:3}}>Fast paths for a booth demonstration.</Typography>
            <Box sx={{display:'grid',gap:2}}>
              <Button href={`/${lang}/inspections/new?occupancy=${occupancy.id}`} variant='contained' color='error' startIcon={<i className='tabler-clipboard-check'/>}>Start Demo Inspection</Button>
              {preplan ? <Button href={`/${lang}/preplans/${preplan.id}`} variant='tonal' startIcon={<i className='tabler-map-2'/>}>Open Suggested Preplan</Button> : <Button href={`/${lang}/preplans/new`} variant='tonal'>Create Demo Preplan</Button>}
              <Button href={`/${lang}/hydrants`} variant='outlined' startIcon={<i className='tabler-droplet'/>}>View Water Supply</Button>
            </Box>
            <Divider sx={{my:3}}/>
            <Typography variant='subtitle1' sx={{mb:1}}>Suggested inspection programs</Typography>
            <Box sx={{display:'flex',gap:1,flexWrap:'wrap'}}>
              {inspectionTypes.length ? inspectionTypes.map(x=><Chip key={x.id} size='small' variant='tonal' label={x.name}/>) : <Typography color='text.secondary'>No demo suggestions.</Typography>}
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Alert severity='info' variant='outlined' sx={{mt:3}}>
        Suggested preplan, inspection, and water-supply links are demo-navigation aids only unless explicitly identified as source-linked.
      </Alert>
    </div>
  )
}
