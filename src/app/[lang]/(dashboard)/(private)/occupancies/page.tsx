import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
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

export default async function OccupanciesPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params
  const rows=loadForgeSeed<any[]>('occupancies')
  const sprinklered=rows.filter(r=>r.sprinklered===true).length
  const alarmed=rows.filter(r=>r.fireAlarm===true).length
  const active=rows.filter(r=>String(r.status).toLowerCase()==='active').length

  return (
    <div>
      <PageHeader title='Occupancies' description='Building intelligence and prevention records for responder and inspector use.' />
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
        <StatCard label='Occupancies' value={rows.length} detail='Source-backed records' icon='tabler-building' color='info'/>
        <StatCard label='Active' value={active} detail='Current occupancy records' icon='tabler-circle-check' color='success'/>
        <StatCard label='Sprinklered' value={sprinklered} detail='Recorded protection status' icon='tabler-sprinkler' color='info'/>
        <StatCard label='Fire Alarm' value={alarmed} detail='Recorded alarm status' icon='tabler-bell' color='warning'/>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:2,flexWrap:'wrap',mb:3}}>
            <div>
              <Typography variant='h5'>Occupancy Registry</Typography>
              <Typography color='text.secondary'>Open a record for responder, prevention, and preplan context.</Typography>
            </div>
            <Button href={`/${lang}/preplans/new`} variant='contained' color='error' startIcon={<i className='tabler-plus'/>}>New Demo Preplan</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead><TableRow><TableCell>Occupancy</TableCell><TableCell>Type</TableCell><TableCell>Protection</TableCell><TableCell>Status</TableCell><TableCell align='right'>Action</TableCell></TableRow></TableHead>
              <TableBody>
                {rows.map(row=>(
                  <TableRow hover key={row.id}>
                    <TableCell><Typography fontWeight={700}>{row.name}</Typography><Typography variant='caption' color='text.secondary'>{row.address}, {row.city}</Typography></TableCell>
                    <TableCell>{row.occupancyType || '—'}</TableCell>
                    <TableCell><Box sx={{display:'flex',gap:1,flexWrap:'wrap'}}><Chip size='small' variant='tonal' color={row.sprinklered?'success':'default'} label={row.sprinklered?'Sprinklered':'No sprinkler recorded'}/><Chip size='small' variant='tonal' color={row.fireAlarm?'info':'default'} label={row.fireAlarm?'Alarm':'No alarm recorded'}/></Box></TableCell>
                    <TableCell><Chip size='small' variant='tonal' color='success' label={row.status || 'Active'}/></TableCell>
                    <TableCell align='right'><Button href={`/${lang}/occupancies/${row.id}`} size='small' endIcon={<i className='tabler-chevron-right'/>}>Open</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </div>
  )
}
