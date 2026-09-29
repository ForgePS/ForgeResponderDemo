import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import SourceBoundaryAlert from '@views/forge-responder/SourceBoundaryAlert'

export default async function InvestigationsPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params
  return <div>
    <PageHeader title='Investigations' description='Case intake, origin-and-cause documentation, evidence, chain of custody, analysis, and review.'/>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
      <StatCard label='Open Cases' value={0} detail='No source investigation history' icon='tabler-flame' color='error'/>
      <StatCard label='Pending Review' value={0} detail='Demo workflow only' icon='tabler-user-check' color='warning'/>
      <StatCard label='Evidence Items' value={0} detail='Demo workflow only' icon='tabler-package' color='info'/>
      <StatCard label='Closed Cases' value={0} detail='No source investigation history' icon='tabler-circle-check' color='success'/>
    </Box>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'1.2fr .8fr'},gap:3,mb:3}}>
      <Card><CardContent>
        <Typography variant='h5'>Investigation Lifecycle</Typography>
        <Box sx={{display:'grid',gap:2,mt:3}}>
          {['Case Intake','Scene Documentation','Evidence & Chain of Custody','Analysis','Supervisor Review & Close'].map((x,i)=><Box key={x} sx={{display:'flex',gap:2,alignItems:'center'}}><Box sx={{width:30,height:30,borderRadius:'50%',bgcolor:'error.lightOpacity',color:'error.main',display:'grid',placeItems:'center',fontWeight:800}}>{i+1}</Box><Typography fontWeight={700}>{x}</Typography></Box>)}
        </Box>
      </CardContent></Card>
      <Card><CardContent>
        <Typography variant='h5'>Start a Case</Typography>
        <Typography color='text.secondary' sx={{my:2}}>Demonstrate scene documentation, evidence intake, chain of custody, and review.</Typography>
        <Button href={`/${lang}/investigations/new`} fullWidth variant='contained' color='error'>Open Demo Case</Button>
      </CardContent></Card>
    </Box>
    <SourceBoundaryAlert>No source-backed investigation case collection was present. Historical investigation records are intentionally not fabricated.</SourceBoundaryAlert>
  </div>
}
