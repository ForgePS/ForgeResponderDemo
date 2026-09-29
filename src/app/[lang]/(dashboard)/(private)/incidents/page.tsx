import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import SourceBoundaryAlert from '@views/forge-responder/SourceBoundaryAlert'

export default async function IncidentsPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params
  return (
    <div>
      <PageHeader title='Incidents' description='Dispatch-to-review incident workflow with officer review and NERIS readiness.' />
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
        <StatCard label='Open Incidents' value={0} detail='No source incident history' icon='tabler-alert-triangle' color='warning'/>
        <StatCard label='Pending Review' value={0} detail='Demo workflow only' icon='tabler-user-check' color='info'/>
        <StatCard label='NERIS Ready' value={0} detail='No source incident records' icon='tabler-file-check' color='success'/>
        <StatCard label='Locked' value={0} detail='No source incident records' icon='tabler-lock' color='info'/>
      </Box>

      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'1.2fr .8fr'},gap:3,mb:3}}>
        <Card><CardContent>
          <Typography variant='h5'>Incident Lifecycle</Typography>
          <Typography color='text.secondary' sx={{mt:1,mb:3}}>Demonstration of the intended operational record flow.</Typography>
          <Box sx={{display:'flex',flexWrap:'wrap',gap:1}}>
            {['DRAFT','ACTIVE','COMPLETED','SUBMITTED','APPROVED','LOCKED'].map(state=><Box key={state} sx={{px:2,py:1,border:'1px solid',borderColor:'divider',borderRadius:2,fontWeight:700}}>{state}</Box>)}
          </Box>
        </CardContent></Card>

        <Card><CardContent>
          <Typography variant='h5'>Start a Demo</Typography>
          <Typography color='text.secondary' sx={{mt:1,mb:3}}>Walk through the incident workflow using local-only demo state.</Typography>
          <Button href={`/${lang}/incidents/new`} fullWidth variant='contained' color='error' startIcon={<i className='tabler-plus'/>}>Create Demo Incident</Button>
        </CardContent></Card>
      </Box>

      <SourceBoundaryAlert>No source-backed incident collection was present in the imported export. Historical incident rows are intentionally not fabricated.</SourceBoundaryAlert>
    </div>
  )
}
