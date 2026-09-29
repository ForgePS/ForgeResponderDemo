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

export default async function ShiftTradesPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params
  const trades=loadForgeSeed<any[]>('shift-trades')
  const pending=trades.filter(x=>String(x.status).toLowerCase().includes('pending')).length
  const approved=trades.filter(x=>String(x.status).toLowerCase().includes('approv')).length
  const denied=trades.filter(x=>String(x.status).toLowerCase().includes('denied')).length

  return <div>
    <PageHeader title='Shift Trades' description='Request, coverage, qualification review, and approval workflow.'/>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
      <StatCard label='Source Trades' value={trades.length} detail='Imported records' icon='tabler-calendar-repeat' color='info'/>
      <StatCard label='Pending' value={pending} detail='Source status' icon='tabler-clock' color='warning'/>
      <StatCard label='Approved' value={approved} detail='Source status' icon='tabler-circle-check' color='success'/>
      <StatCard label='Denied' value={denied} detail='Source status' icon='tabler-circle-x' color='error'/>
    </Box>
    <Box sx={{display:'flex',justifyContent:'flex-end',mb:3}}><Button href={`/${lang}/scheduling/shift-trades/new`} variant='contained' color='error' startIcon={<i className='tabler-plus'/>}>Request Demo Trade</Button></Box>
    <Card><CardContent>
      <Typography variant='h5' sx={{mb:2}}>Trade History</Typography>
      <TableContainer><Table><TableHead><TableRow><TableCell>Trade</TableCell><TableCell>Requester</TableCell><TableCell>Coverage</TableCell><TableCell>Shift / Date</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
        <TableBody>{trades.map(t=><TableRow hover key={t.id}><TableCell>{t.id}</TableCell><TableCell>{t.requester||'—'}</TableCell><TableCell>{t.requestedWith||'—'}</TableCell><TableCell>{[t.shift,t.date].filter(Boolean).join(' · ')||'Not recorded'}</TableCell><TableCell><Chip size='small' variant='tonal' color={String(t.status).toLowerCase().includes('denied')?'error':String(t.status).toLowerCase().includes('approv')?'success':'warning'} label={t.status||'Unknown'}/></TableCell></TableRow>)}</TableBody>
      </Table></TableContainer>
    </CardContent></Card>
  </div>
}
