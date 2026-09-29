import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import ReportBuilder from '@views/forge-responder/ReportBuilder'
import { loadForgeSeed } from '@/utils/forgeSeed'
import { nerisCatalog } from '@/utils/nerisSchema'

export default function ReportsPage() {
  const hydrants=loadForgeSeed<any[]>('hydrants')
  const personnel=loadForgeSeed<any[]>('personnel')
  const apparatus=loadForgeSeed<any[]>('apparatus')
  const occupancies=loadForgeSeed<any[]>('occupancies')
  return <div>
    <PageHeader title='Reports' description='Operational report previews across water supply, personnel, fleet, prevention, audit, and NERIS.'/>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
      <StatCard label='Hydrants' value={hydrants.length} detail='Reportable source records' icon='tabler-droplet' color='info'/>
      <StatCard label='Personnel' value={personnel.length} detail='Reportable source records' icon='tabler-users' color='success'/>
      <StatCard label='Apparatus' value={apparatus.length} detail='Reportable source records' icon='tabler-truck' color='warning'/>
      <StatCard label='NERIS Fields' value={nerisCatalog.summary.fieldCount} detail='Schema coverage reporting' icon='tabler-file-check' color='error'/>
    </Box>
    <ReportBuilder/>
    <Card sx={{mt:3}}><CardContent><Typography variant='h5'>Available Data Domains</Typography><Typography color='text.secondary' sx={{mt:1}}>Source-backed reporting currently includes {occupancies.length} occupancies plus hydrants, personnel, apparatus, activity, audit, prevention configuration, and NERIS schema coverage.</Typography></CardContent></Card>
  </div>
}
