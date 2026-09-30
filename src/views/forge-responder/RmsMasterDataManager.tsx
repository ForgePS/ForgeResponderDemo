'use client'

import { useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

type Kind = 'stations' | 'shifts' | 'apparatus' | 'units'

type FieldDef = {
  key: string
  label: string
  required?: boolean
}

type Config = {
  label: string
  singular: string
  fields: FieldDef[]
}

const configs: Record<Kind, Config> = {
  stations: {
    label: 'Stations',
    singular: 'Station',
    fields: [
      { key: 'stationNumber', label: 'Station Number', required: true },
      { key: 'name', label: 'Name', required: true },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'timezone', label: 'Timezone' },
      { key: 'status', label: 'Status', required: true }
    ]
  },
  shifts: {
    label: 'Shifts',
    singular: 'Shift',
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'code', label: 'Code', required: true },
      { key: 'scheduleReference', label: 'Schedule Reference' },
      { key: 'status', label: 'Status', required: true }
    ]
  },
  apparatus: {
    label: 'Apparatus',
    singular: 'Apparatus',
    fields: [
      { key: 'apparatusNumber', label: 'Apparatus Number', required: true },
      { key: 'name', label: 'Name', required: true },
      { key: 'apparatusType', label: 'Type', required: true },
      { key: 'stationId', label: 'Station ID' },
      { key: 'nerisClassification', label: 'NERIS Classification' },
      { key: 'status', label: 'Status', required: true }
    ]
  },
  units: {
    label: 'Units',
    singular: 'Unit',
    fields: [
      { key: 'unitNumber', label: 'Unit Number', required: true },
      { key: 'callSign', label: 'Call Sign', required: true },
      { key: 'unitType', label: 'Unit Type', required: true },
      { key: 'apparatusId', label: 'Apparatus ID' },
      { key: 'stationId', label: 'Station ID' },
      { key: 'status', label: 'Status', required: true }
    ]
  }
}

type Row = Record<string, unknown> & {
  id: string
  recordVersion?: number
}

export default function RmsMasterDataManager() {
  const [kind, setKind] = useState<Kind>('stations')
  const [rows, setRows] = useState<Row[]>([])
  const [source, setSource] = useState<'platform' | 'demo'>('demo')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})

  const config = configs[kind]

  const emptyForm = useMemo(
    () => Object.fromEntries(config.fields.map(field => [field.key, field.key === 'status' ? 'ACTIVE' : ''])),
    [config]
  )

  async function load() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/rms/${kind}?pageSize=100`, { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to load RMS master data.')
      setRows(body.data || [])
      setSource(body.source || 'demo')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load RMS master data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [kind])

  function beginCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function beginEdit(row: Row) {
    setEditing(row)
    setForm(Object.fromEntries(config.fields.map(field => [field.key, String(row[field.key] ?? '')])))
    setOpen(true)
  }

  async function save() {
    setError('')
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim() === '' ? null : value.trim()])
    )

    try {
      const response = await fetch(editing ? `/api/rms/${kind}/${editing.id}` : `/api/rms/${kind}`, {
        method: editing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(editing ? { 'x-record-version': String(editing.recordVersion || 1) } : {})
        },
        body: JSON.stringify(payload)
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to save record.')
      setOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save record.')
    }
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete this ${config.singular.toLowerCase()} record?`)) return

    setError('')
    try {
      const response = await fetch(`/api/rms/${kind}/${row.id}`, {
        method: 'DELETE',
        headers: { 'x-record-version': String(row.recordVersion || 1) }
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to delete record.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete record.')
    }
  }

  return (
    <>
      {error ? <Alert severity='error' sx={{ mb: 3 }}>{error}</Alert> : null}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', mb: 3 }}>
            <Box>
              <Typography variant='h5'>RMS Master Data</Typography>
              <Typography color='text.secondary'>
                {source === 'platform' ? 'Live Forge Platform connection' : 'Standalone demo data'} · {rows.length} records
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField select size='small' value={kind} onChange={event => setKind(event.target.value as Kind)} sx={{ minWidth: 180 }}>
                {Object.entries(configs).map(([value, item]) => (
                  <MenuItem key={value} value={value}>{item.label}</MenuItem>
                ))}
              </TextField>
              <Button variant='contained' color='error' onClick={beginCreate}>Add {config.singular}</Button>
            </Box>
          </Box>

          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  {config.fields.slice(0, 5).map(field => <TableCell key={field.key}>{field.label}</TableCell>)}
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => (
                  <TableRow hover key={row.id}>
                    {config.fields.slice(0, 5).map(field => (
                      <TableCell key={field.key}>{String(row[field.key] ?? '—')}</TableCell>
                    ))}
                    <TableCell align='right'>
                      <Button size='small' onClick={() => beginEdit(row)}>Edit</Button>
                      <Button size='small' color='error' onClick={() => void remove(row)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color='text.secondary'>No {config.label.toLowerCase()} records yet.</Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>{editing ? `Edit ${config.singular}` : `Add ${config.singular}`}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '12px !important' }}>
          {config.fields.map(field => (
            <TextField
              key={field.key}
              label={field.label}
              required={field.required}
              value={form[field.key] ?? ''}
              onChange={event => setForm(current => ({ ...current, [field.key]: event.target.value }))}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant='contained' color='error' onClick={() => void save()}>
            {editing ? 'Save Changes' : `Create ${config.singular}`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
