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

export default async function PreplansPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params
  const rows=loadForgeSeed<any[]>('preplans')
  const published=rows.filter(r=>String(r.publicationStatus).toLowerCase()==='published').length

  return (
    <div>
      <PageHeader title='Preplans' description='Responder pre-incident planning for access, hazards, utilities, protection systems, and tactical awareness.' />
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
        <StatCard label='Preplans' value={rows.length} detail='Source-backed records' icon='tabler-map-2' color='error'/>
        <StatCard label='Published' value={published} detail='Source publication status' icon='tabler-circle-check' color='success'/>
        <StatCard label='Draft / Unpublished' value={rows.length-published} detail='Source publication status' icon='tabler-edit' color='warning'/>
        <StatCard label='Demo Builder' value='Ready' detail='Local-only workflow' icon='tabler-wand' color='info'/>
      </Box>

      <Box sx={{display:'flex',justifyContent:'flex-end',mb:3}}>
        <Button href={`/${lang}/preplans/new`} variant='contained' color='error' startIcon={<i className='tabler-plus'/>}>New Demo Preplan</Button>
      </Box>

      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(2,1fr)'},gap:3,mb:3}}>
        {rows.map(row=>(
          <Card key={row.id}>
            <CardContent>
              <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'flex-start'}}>
                <div>
                  <Typography variant='h5'>{row.title || row.name || row.id}</Typography>
                  <Typography color='text.secondary' sx={{mt:.5}}>Version {row.version || 1}</Typography>
                </div>
                <Chip size='small' variant='tonal' color={row.publicationStatus==='published'?'success':'warning'} label={row.publicationStatus || 'unpublished'}/>
              </Box>
              <Box sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:2,my:3}}>
                <div><Typography variant='caption' color='text.secondary'>Construction</Typography><Typography>{row.buildingConstruction || 'Not recorded'}</Typography></div>
                <div><Typography variant='caption' color='text.secondary'>Occupancy Use</Typography><Typography>{row.occupancyUse || 'Not recorded'}</Typography></div>
              </Box>
              <Button href={`/${lang}/preplans/${row.id}`} fullWidth variant='tonal' endIcon={<i className='tabler-arrow-right'/>}>Open Preplan</Button>
            </CardContent>
          </Card>
        ))}
      </Box>

      <SourceBoundaryAlert>
        The source export contains one normalized preplan record. The new-preplan workflow creates presentation-only local data and does not modify that source record.
      </SourceBoundaryAlert>
    </div>
  )
}
