import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import { listRmsMasterData } from '@/lib/forge-platform/rms'

type OccupancyRow = {
  id: string
  name?: string
  addressLine1?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  occupancyType?: string | null
  status?: string
  preplanId?: string | null
  sprinklered?: boolean
  fireAlarm?: boolean
}

export default async function OccupanciesPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params
  const result=await listRmsMasterData<OccupancyRow>('occupancies')
  const rows=result.data
  const active=rows.filter(r=>String(r.status).toUpperCase()==='ACTIVE').length
  const linked=rows.filter(r=>Boolean(r.preplanId)).length

  return (
    <div>
      <PageHeader title='Occupancies' description='Building intelligence and prevention records for responder and inspector use.' />
      <Alert severity={result.source==='platform'?'success':'info'} variant='outlined' sx={{mb:3}}>
        {result.source==='platform'?'Connected to Forge Platform RMS occupancy data.':'Standalone demo mode — using persistent occupancy data.'}
      </Alert>
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
        <StatCard label='Occupancies' value={rows.length} detail='Current records' icon='tabler-building' color='info'/>
        <StatCard label='Active' value={active} detail='Active occupancy records' icon='tabler-circle-check' color='success'/>
        <StatCard label='Preplan Linked' value={linked} detail='Occupancies with linked plans' icon='tabler-map-2' color='error'/>
        <StatCard label='Data Source' value={result.source==='platform'?'Live':'Demo'} detail='Forge data adapter' icon='tabler-database' color='warning'/>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:2,flexWrap:'wrap',mb:3}}>
            <div>
              <Typography variant='h5'>Occupancy Registry</Typography>
              <Typography color='text.secondary'>Open a record for responder, prevention, and preplan context.</Typography>
            </div>
            <Box sx={{display:'flex',gap:2}}>
              <Button href={`/${lang}/settings/master-data`} variant='outlined'>Manage Occupancies</Button>
              <Button href={`/${lang}/preplans/new`} variant='contained' color='error' startIcon={<i className='tabler-plus'/>}>New Preplan</Button>
            </Box>
          </Box>
          <TableContainer>
            <Table>
              <TableHead><TableRow><TableCell>Occupancy</TableCell><TableCell>Type</TableCell><TableCell>Preplan</TableCell><TableCell>Status</TableCell><TableCell align='right'>Action</TableCell></TableRow></TableHead>
              <TableBody>
                {rows.map(row=>(
                  <TableRow hover key={row.id}>
                    <TableCell>
                      <Typography fontWeight={700}>{row.name || row.id}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {[row.addressLine1 || row.address,row.city,row.state].filter(Boolean).join(', ') || 'Address not recorded'}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.occupancyType || '—'}</TableCell>
                    <TableCell><Chip size='small' variant='tonal' color={row.preplanId?'success':'default'} label={row.preplanId?'Linked':'Not linked'}/></TableCell>
                    <TableCell><Chip size='small' variant='tonal' color={String(row.status).toUpperCase()==='ACTIVE'?'success':'warning'} label={row.status || 'ACTIVE'}/></TableCell>
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
