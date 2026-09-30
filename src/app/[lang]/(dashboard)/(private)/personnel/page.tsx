import Box from '@mui/material/Box'
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
import Alert from '@mui/material/Alert'

import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import { listRmsMasterData } from '@/lib/forge-platform/rms'

type PersonnelRow = {
  id: string
  personId?: string
  displayName?: string
  agencyPersonnelId?: string
  rank?: string
  qualificationSummary?: string | null
  stationId?: string | null
  shiftId?: string | null
  station?: string | null
  shift?: string | null
  assignment?: string | null
  ems?: string | null
  status?: string
  incidentEligible?: boolean
}

type StationRow = { id: string; stationNumber?: string; name?: string }
type ShiftRow = { id: string; code?: string; name?: string }

export default async function PersonnelPage() {
  const [personnelResult, stationResult, shiftResult] = await Promise.all([
    listRmsMasterData<PersonnelRow>('personnel'),
    listRmsMasterData<StationRow>('stations'),
    listRmsMasterData<ShiftRow>('shifts')
  ])

  const rows = personnelResult.data
  const stationMap = new Map(
    stationResult.data.map(station => [station.id, station.name || station.stationNumber || station.id])
  )
  const shiftMap = new Map(
    shiftResult.data.map(shift => [shift.id, shift.name || shift.code || shift.id])
  )

  const active = rows.filter(row => /active/i.test(String(row.status))).length
  const medics = rows.filter(row =>
    /paramedic/i.test(String(row.ems || row.qualificationSummary || ''))
  ).length
  const officers = rows.filter(row => /lieutenant|captain|chief/i.test(String(row.rank))).length

  return (
    <div>
      <PageHeader
        title='Personnel'
        description='Roster, assignments, EMS credentials, certifications, and qualifications.'
      />

      <Alert severity={personnelResult.source === 'platform' ? 'success' : 'info'} variant='outlined' sx={{ mb: 3 }}>
        {personnelResult.source === 'platform'
          ? 'Connected to Forge Platform RMS personnel master data.'
          : 'Standalone demo mode — using sanitized persistent demo data.'}
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', xl: 'repeat(4,1fr)' }, gap: 3, mb: 3 }}>
        <StatCard label='Personnel' value={rows.length} detail='Roster records' icon='tabler-users' color='primary' />
        <StatCard label='Active' value={active} detail='Active personnel records' icon='tabler-user-check' color='success' />
        <StatCard label='Paramedics' value={medics} detail='EMS / qualification match' icon='tabler-heart-rate-monitor' color='error' />
        <StatCard label='Officers' value={officers} detail='Lieutenant and above' icon='tabler-shield-star' color='warning' />
      </Box>

      <Card>
        <CardContent>
          <Typography variant='h5'>Personnel Roster</Typography>
          <Typography color='text.secondary' className='mbe-4'>
            ThemeSelection roster backed by Forge Platform RMS master data when connected.
          </Typography>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Personnel</TableCell>
                  <TableCell>Rank</TableCell>
                  <TableCell>Shift</TableCell>
                  <TableCell>Station</TableCell>
                  <TableCell>Assignment / Qualifications</TableCell>
                  <TableCell>EMS</TableCell>
                  <TableCell>Incident Eligible</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => {
                  const displayName = row.displayName || row.personId || row.id
                  const subId = row.agencyPersonnelId || (row.personId && row.displayName ? row.personId : '')
                  const shift = row.shift || (row.shiftId ? shiftMap.get(row.shiftId) : undefined) || '—'
                  const station = row.station || (row.stationId ? stationMap.get(row.stationId) : undefined) || '—'
                  const summary = row.assignment || row.qualificationSummary || '—'

                  return (
                    <TableRow hover key={row.id}>
                      <TableCell>
                        <Typography fontWeight={700}>{displayName}</Typography>
                        {subId ? <Typography variant='caption' color='text.secondary'>{subId}</Typography> : null}
                      </TableCell>
                      <TableCell>{row.rank || '—'}</TableCell>
                      <TableCell>{shift}</TableCell>
                      <TableCell>{station}</TableCell>
                      <TableCell>{summary}</TableCell>
                      <TableCell>
                        {row.ems ? (
                          <Chip
                            size='small'
                            variant='tonal'
                            color={String(row.ems).toLowerCase().includes('paramedic') ? 'error' : 'info'}
                            label={row.ems}
                          />
                        ) : '—'}
                      </TableCell>
                      <TableCell>{row.incidentEligible === undefined ? '—' : row.incidentEligible ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{row.status || '—'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </div>
  )
}
