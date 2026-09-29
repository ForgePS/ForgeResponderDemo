import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import SourceBoundaryAlert from '@views/forge-responder/SourceBoundaryAlert'
import { loadForgeSeed } from '@/utils/forgeSeed'

export default async function TrainingPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params
  const personnel=loadForgeSeed<any[]>('personnel')
  const certs=personnel.flatMap(p=>p.certifications || [])
  const emsCreds=personnel.flatMap(p=>p.emsCredentials || [])
  const instructors=personnel.filter(p=>p.isTrainingInstructor).length
  const activeCredentials=[...certs,...emsCreds].filter((c:any)=>String(c.status||'').toLowerCase().includes('active') || String(c.status||'').toLowerCase().includes('current')).length

  return (
    <div>
      <PageHeader title='Training' description='Assignments, completions, certifications, instructor workflows, and readiness.' />
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
        <StatCard label='Personnel' value={personnel.length} detail='Source-backed roster' icon='tabler-users' color='info'/>
        <StatCard label='Credential Records' value={certs.length+emsCreds.length} detail='Certifications + EMS credentials' icon='tabler-certificate' color='success'/>
        <StatCard label='Current / Active' value={activeCredentials} detail='Source credential status' icon='tabler-circle-check' color='success'/>
        <StatCard label='Training Instructors' value={instructors} detail='Source instructor flags' icon='tabler-school' color='warning'/>
      </Box>

      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'repeat(3,1fr)'},gap:3,mb:3}}>
        <Card><CardContent><Typography variant='h5'>Assign Training</Typography><Typography color='text.secondary' sx={{my:2}}>Set audience, due date, delivery method, score, skills, and renewal cycle.</Typography><Button href={`/${lang}/training/assign`} fullWidth variant='contained' color='error'>Assign Demo Training</Button></CardContent></Card>
        <Card><CardContent><Typography variant='h5'>Record Completion</Typography><Typography color='text.secondary' sx={{my:2}}>Capture participant, score, practical evaluation, and instructor verification.</Typography><Button href={`/${lang}/training/complete`} fullWidth variant='tonal'>Record Completion</Button></CardContent></Card>
        <Card><CardContent><Typography variant='h5'>Personnel Credentials</Typography><Typography color='text.secondary' sx={{my:2}}>Open source-backed personnel records and review current credentials.</Typography><Button href={`/${lang}/personnel`} fullWidth variant='outlined'>Open Personnel</Button></CardContent></Card>
      </Box>

      <SourceBoundaryAlert>Credential data is source-backed. Training assignments and completions created in this demo remain browser-local because the source export did not contain standalone historical training-event records.</SourceBoundaryAlert>
    </div>
  )
}
