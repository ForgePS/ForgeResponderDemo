import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import SourceBoundaryAlert from '@views/forge-responder/SourceBoundaryAlert'
import { loadForgeSeed } from '@/utils/forgeSeed'

export default async function EmsPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params
  const personnel=loadForgeSeed<any[]>('personnel')
  const certs=personnel.flatMap(p=>p.certifications || [])
  const paramedics=personnel.filter(p=>JSON.stringify(p).toLowerCase().includes('paramedic')).length
  const emts=personnel.filter(p=>JSON.stringify(p).toLowerCase().includes('emt')).length

  return (
    <div>
      <PageHeader title='EMS Operations' description='Credential readiness, patient-care documentation, QA/QI, and ePCR workflow.' />
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
        <StatCard label='Paramedic Profiles' value={paramedics} detail='Source-backed personnel data' icon='tabler-heartbeat' color='error'/>
        <StatCard label='EMT Profiles' value={emts} detail='Source-backed personnel data' icon='tabler-ambulance' color='info'/>
        <StatCard label='Certification Entries' value={certs.length} detail='From personnel certification arrays' icon='tabler-certificate' color='success'/>
        <StatCard label='Open ePCRs' value={0} detail='No source ePCR history' icon='tabler-file-medical' color='warning'/>
      </Box>

      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'repeat(3,1fr)'},gap:3,mb:3}}>
        <Card><CardContent><Typography variant='h5'>Patient Care</Typography><Typography color='text.secondary' sx={{my:2}}>Walk through response, assessment, care, disposition, and review.</Typography><Button href={`/${lang}/epcr/new`} fullWidth variant='contained' color='error'>Start Demo ePCR</Button></CardContent></Card>
        <Card><CardContent><Typography variant='h5'>EMS Staffing</Typography><Typography color='text.secondary' sx={{my:2}}>Use source-backed personnel records to demonstrate credential awareness.</Typography><Button href={`/${lang}/personnel`} fullWidth variant='tonal'>Open Personnel</Button></CardContent></Card>
        <Card><CardContent><Typography variant='h5'>QA / Reporting</Typography><Typography color='text.secondary' sx={{my:2}}>Show the quality-review surface without inventing source ePCR history.</Typography><Button href={`/${lang}/reports`} fullWidth variant='outlined'>Open Reports</Button></CardContent></Card>
      </Box>

      <SourceBoundaryAlert>The export did not contain a source-backed ePCR history. EMS credential summaries come from personnel records; patient-care runs are demo-only.</SourceBoundaryAlert>
    </div>
  )
}
