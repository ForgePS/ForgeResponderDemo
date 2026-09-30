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

type ApparatusRow = {
  id: string
  apparatusNumber?: string
  unitNumber?: string
  name?: string
  apparatusType?: string
  assetType?: string
  class?: string
  stationId?: string | null
  station?: string | null
  status?: string
  nerisClassification?: string | null
  maintenanceStatus?: string | null
  mileage?: number | null
}

type StationRow = {
  id: string
  stationNumber?: string
  name?: string
}

export default async function ApparatusPage() {
  const [apparatusResult, stationResult] = await Promise.all([
    listRmsMasterData<ApparatusRow>('apparatus'),
    listRmsMasterData<StationRow>('stations')
  ])

  const rows = apparatusResult.data
  const stationMap = new Map(
    stationResult.data.map(station => [
      station.id,
      station.name || station.stationNumber || station.id
    ])
  )

  const ready = rows.filter(row => /active|in_service|ready|available/i.test(String(row.status))).length
  const stations = new Set(
    rows
      .map(row => row.station || (row.stationId ? stationMap.get(row.stationId) : undefined))
      .filter(Boolean)
  ).size

  return (
    <div>
      <PageHeader
        title='Apparatus'
        description='Fleet readiness, assignments, maintenance, testing, and operational status.'
      />

      <Alert severity={apparatusResult.source === 'platform' ? 'success' : 'info'} variant='outlined' sx={{ mb: 3 }}>
        {apparatusResult.source === 'platform'
          ? 'Connected to Forge Platform RMS master data.'
          : 'Standalone demo mode — using sanitized persistent demo data.'}
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', xl: 'repeat(4,1fr)' }, gap: 3, mb: 3 }}>
        <StatCard label='Fleet Assets' value={rows.length} detail='Apparatus records' icon='tabler-truck' color='primary' />
        <StatCard label='Ready' value={ready} detail='Current readiness state' icon='tabler-circle-check' color='success' />
        <StatCard label='Stations' value={stations} detail='Assigned station locations' icon='tabler-building-community' color='info' />
        <StatCard label='Data Source' value={apparatusResult.source === 'platform' ? 'Live' : 'Demo'} detail='Forge data adapter' icon='tabler-database' color='warning' />
      </Box>

      <Card>
        <CardContent>
          <Typography variant='h5'>Fleet Registry</Typography>
          <Typography color='text.secondary' className='mbe-4'>
            ThemeSelection presentation backed by the Forge Responder data adapter.
          </Typography>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Unit</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Station</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>NERIS</TableCell>
                  <TableCell>Maintenance</TableCell>
                  <TableCell align='right'>Mileage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => {
                  const unit = row.apparatusNumber || row.unitNumber || row.id
                  const type = row.apparatusType || row.assetType || row.class || '—'
                  const station = row.station || (row.stationId ? stationMap.get(row.stationId) : undefined) || '—'
                  const status = String(row.status || 'Unknown')
                  const isReady = /active|in_service|ready|available/i.test(status)

                  return (
                    <TableRow hover key={row.id}>
                      <TableCell><Typography fontWeight={800}>{unit}</Typography></TableCell>
                      <TableCell>{row.name || '—'}</TableCell>
                      <TableCell>{type}</TableCell>
                      <TableCell>{station}</TableCell>
                      <TableCell>
                        <Chip
                          size='small'
                          color={isReady ? 'success' : 'warning'}
                          variant='tonal'
                          label={status.replaceAll('_', ' ')}
                        />
                      </TableCell>
                      <TableCell>{row.nerisClassification || '—'}</TableCell>
                      <TableCell>{row.maintenanceStatus || '—'}</TableCell>
                      <TableCell align='right'>
                        {row.mileage ? Math.round(row.mileage).toLocaleString() : '—'}
                      </TableCell>
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
