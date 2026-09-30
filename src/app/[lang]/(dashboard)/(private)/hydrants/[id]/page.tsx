import { notFound } from 'next/navigation'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import { loadForgeSeed } from '@/utils/forgeSeed'

export default async function HydrantDetailPage({params}:{params:Promise<{lang:string,id:string}>}) {
  const {lang,id}=await params
  const hydrants=loadForgeSeed<any[]>('hydrants')
  const hydrant=hydrants.find(h=>h.id===id)
  if(!hydrant) notFound()

  const flowTests=loadForgeSeed<any[]>('hydrant-flow-tests').filter(t=>t.hydrantId===id || t.hydrant_id===id || t.hydrantId===hydrant.displayId)
  const inspections=loadForgeSeed<any[]>('hydrant-inspections').filter(t=>t.hydrantId===id || t.hydrant_id===id || t.hydrantId===hydrant.displayId)
  const damage=loadForgeSeed<any[]>('hydrant-damage-reports').filter(t=>t.hydrantId===id || t.hydrant_id===id || t.hydrantId===hydrant.displayId)

  return <div>
    <Box sx={{mb:2}}><Button href={`/${lang}/hydrants`} startIcon={<i className='tabler-arrow-left'/>}>Hydrants</Button></Box>
    <PageHeader title={hydrant.displayId || hydrant.id} description={hydrant.address || 'Hydrant detail'}/>

    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
      <StatCard label='Status' value={hydrant.status || 'Unknown'} detail='Operational state' icon='tabler-droplet' color={hydrant.status==='In Service'?'success':hydrant.status==='Out of Service'?'error':'warning'}/>
      <StatCard label='NFPA Class' value={hydrant.nfpaClass || '—'} detail={hydrant.nfpaColor || 'Capacity marking'} icon='tabler-color-swatch' color='info'/>
      <StatCard label='Recorded Flow' value={hydrant.flowGpm ? `${Math.round(hydrant.flowGpm)} GPM` : '—'} detail='Current summary value' icon='tabler-gauge' color='error'/>
      <StatCard label='Flow Tests' value={flowTests.length} detail={`${inspections.length} inspections · ${damage.length} damage reports`} icon='tabler-history' color='warning'/>
    </Box>

    <Box sx={{display:'flex',gap:2,flexWrap:'wrap',mb:3}}>
      <Button href={`/${lang}/hydrants/${id}/edit`} variant='outlined' startIcon={<i className='tabler-edit'/>}>Edit Hydrant</Button>
      <Button href={`/${lang}/hydrants/${id}/flow-test/new`} variant='contained' color='error' startIcon={<i className='tabler-gauge'/>}>Start Flow Test</Button>
      <Button href={`/${lang}/hydrants/${id}/inspection/new`} variant='tonal' startIcon={<i className='tabler-clipboard-check'/>}>Start Inspection</Button>
      <Button href={`/${lang}/hydrants/${id}/damage/new`} variant='outlined' startIcon={<i className='tabler-alert-triangle'/>}>Report Damage</Button>
    </Box>

    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'1fr 1fr'},gap:3,mb:3}}>
      <Card><CardContent><Typography variant='h5' sx={{mb:3}}>Hydrant Information</Typography>
        <Box sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:2}}>
          {[
            ['Address',hydrant.address],['District',hydrant.district],['Provider',hydrant.provider],['Water Association',hydrant.waterAssoc],
            ['Discharge Size',hydrant.dischargeSize],['Static PSI',hydrant.staticPsi],['Residual PSI',hydrant.residualPsi],['Pitot PSI',hydrant.pitotPsi]
          ].map(([label,value])=><div key={String(label)}><Typography variant='caption' color='text.secondary'>{label}</Typography><Typography fontWeight={600}>{value ?? 'Not recorded'}</Typography></div>)}
        </Box>
      </CardContent></Card>
      <Card><CardContent><Typography variant='h5' sx={{mb:3}}>Location</Typography>
        <Box sx={{display:'grid',gap:2}}>
          <div><Typography variant='caption' color='text.secondary'>Latitude</Typography><Typography>{hydrant.latitude ?? '—'}</Typography></div>
          <div><Typography variant='caption' color='text.secondary'>Longitude</Typography><Typography>{hydrant.longitude ?? '—'}</Typography></div>
          <div><Typography variant='caption' color='text.secondary'>Subdivision</Typography><Typography>{hydrant.subdivision || '—'}</Typography></div>
        </Box>
        <Button href={`/${lang}/maps`} variant='tonal' sx={{mt:3}} startIcon={<i className='tabler-map'/>}>Open GIS Map</Button>
      </CardContent></Card>
    </Box>

    <Card><CardContent>
      <Typography variant='h5' sx={{mb:2}}>Flow Test History</Typography>
      <TableContainer><Table size='small'><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Static</TableCell><TableCell>Residual</TableCell><TableCell>Pitot</TableCell><TableCell>Flow</TableCell><TableCell>Class</TableCell></TableRow></TableHead>
        <TableBody>{flowTests.slice(0,20).map((t,index)=><TableRow key={t.id||index}><TableCell>{t.testDate||t.date||t.createdAt||'—'}</TableCell><TableCell>{t.staticPsi??'—'}</TableCell><TableCell>{t.residualPsi??'—'}</TableCell><TableCell>{t.pitotPsi??'—'}</TableCell><TableCell>{t.flowGpm?`${Math.round(t.flowGpm)} GPM`:'—'}</TableCell><TableCell>{t.nfpaClass||'—'}</TableCell></TableRow>)}</TableBody>
      </Table></TableContainer>
    </CardContent></Card>
  </div>
}
