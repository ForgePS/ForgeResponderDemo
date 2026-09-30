import Alert from '@mui/material/Alert'
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
import { listIncidents } from '@/lib/forge-platform/incidents'

export default async function IncidentsPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params
  const result=await listIncidents()
  const rows=result.data
  const open=rows.filter(x=>!['APPROVED','FINALIZED','VOIDED','ARCHIVED'].includes(x.status)).length
  const pending=rows.filter(x=>x.status==='SUBMITTED_FOR_REVIEW'||x.status==='READY_FOR_REVIEW').length
  const returned=rows.filter(x=>x.status==='RETURNED_FOR_CORRECTION').length
  const approved=rows.filter(x=>x.status==='APPROVED'||x.status==='FINALIZED').length

  return (
    <div>
      <PageHeader title='Incidents' description='Dispatch-to-review incident workflow with resource assignments, narrative, validation, and officer review.' />
      <Alert severity={result.source==='platform'?'success':'info'} variant='outlined' sx={{mb:3}}>
        {result.source==='platform'?'Connected to Forge Platform NERIS incidents.':'Standalone demo mode — incidents persist in the local Forge Responder data store.'}
      </Alert>

      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
        <StatCard label='Open Incidents' value={open} detail='Active incident workflow records' icon='tabler-alert-triangle' color='warning'/>
        <StatCard label='Pending Review' value={pending} detail='Ready / submitted for review' icon='tabler-user-check' color='info'/>
        <StatCard label='Returned' value={returned} detail='Correction required' icon='tabler-arrow-back-up' color='error'/>
        <StatCard label='Approved / Finalized' value={approved} detail='Completed review workflow' icon='tabler-file-check' color='success'/>
      </Box>

      <Card sx={{mb:3}}>
        <CardContent>
          <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:2,flexWrap:'wrap',mb:3}}>
            <Box>
              <Typography variant='h5'>Incident Registry</Typography>
              <Typography color='text.secondary'>Forge Platform incident lifecycle and NERIS reporting workspace.</Typography>
            </Box>
            <Button href={`/${lang}/incidents/new`} variant='contained' color='error' startIcon={<i className='tabler-plus'/>}>New Incident</Button>
          </Box>
          <TableContainer>
            <Table size='small'>
              <TableHead><TableRow><TableCell>Incident</TableCell><TableCell>Date</TableCell><TableCell>Type</TableCell><TableCell>Dispatch</TableCell><TableCell>Status</TableCell><TableCell align='right'>Action</TableCell></TableRow></TableHead>
              <TableBody>
                {rows.map(row=><TableRow hover key={row.id}>
                  <TableCell><Typography fontWeight={800}>{row.incidentNumber}</Typography></TableCell>
                  <TableCell>{row.incidentDate||'—'}</TableCell>
                  <TableCell>{row.primaryIncidentTypeCode||'—'}</TableCell>
                  <TableCell sx={{maxWidth:360}}><Typography noWrap>{row.dispatchDescription||'—'}</Typography></TableCell>
                  <TableCell><Chip size='small' variant='tonal' color={row.status==='APPROVED'||row.status==='FINALIZED'?'success':row.status==='RETURNED_FOR_CORRECTION'?'error':row.status==='SUBMITTED_FOR_REVIEW'?'info':'warning'} label={row.status.replaceAll('_',' ')}/></TableCell>
                  <TableCell align='right'><Button href={`/${lang}/incidents/${row.id}`} size='small' endIcon={<i className='tabler-chevron-right'/>}>Open</Button></TableCell>
                </TableRow>)}
                {rows.length===0?<TableRow><TableCell colSpan={6}><Typography color='text.secondary'>No incident records yet.</Typography></TableCell></TableRow>:null}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant='h5'>Incident Lifecycle</Typography>
          <Typography color='text.secondary' sx={{mt:1,mb:3}}>Matches the Forge Platform NERIS incident contract.</Typography>
          <Box sx={{display:'flex',flexWrap:'wrap',gap:1}}>
            {['DRAFT','IN_PROGRESS','READY_FOR_REVIEW','SUBMITTED_FOR_REVIEW','RETURNED_FOR_CORRECTION','APPROVED','FINALIZED'].map(state=><Box key={state} sx={{px:2,py:1,border:'1px solid',borderColor:'divider',borderRadius:2,fontWeight:700}}>{state.replaceAll('_',' ')}</Box>)}
          </Box>
        </CardContent>
      </Card>
    </div>
  )
}
