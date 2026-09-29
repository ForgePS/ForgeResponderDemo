'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

type BrandingConfig = {
  primaryLogo: string | null
  secondaryLogo: string | null
  updatedAt: string | null
}

type Slot = 'primaryLogo' | 'secondaryLogo'

const empty: BrandingConfig = {
  primaryLogo: null,
  secondaryLogo: null,
  updatedAt: null
}

export default function DemoBrandingSettings() {
  const [branding, setBranding] = useState<BrandingConfig>(empty)
  const [busy, setBusy] = useState<Slot | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch('/api/demo-branding', { cache: 'no-store' })

    if (!res.ok) throw new Error('Unable to load demo branding.')

    setBranding(await res.json())
  }

  useEffect(() => {
    load().catch(() => setError('Unable to load demo branding.'))
  }, [])

  const upload = async (slot: Slot, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file) return

    setBusy(slot)
    setMessage(null)
    setError(null)

    try {
      const form = new FormData()

      form.set('slot', slot)
      form.set('file', file)

      const res = await fetch('/api/demo-branding', {
        method: 'POST',
        body: form
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || 'Logo upload failed.')

      setBranding(data)
      setMessage('Logo saved with this demo installation.')
      window.dispatchEvent(new Event('forge-demo-branding-changed'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logo upload failed.')
    } finally {
      setBusy(null)
    }
  }

  const remove = async (slot: Slot) => {
    setBusy(slot)
    setMessage(null)
    setError(null)

    try {
      const res = await fetch('/api/demo-branding', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || 'Logo removal failed.')

      setBranding(data)
      setMessage('Logo removed from this demo installation.')
      window.dispatchEvent(new Event('forge-demo-branding-changed'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logo removal failed.')
    } finally {
      setBusy(null)
    }
  }

  const renderSlot = (slot: Slot, title: string, help: string) => {
    const value = branding[slot]

    return (
      <Card variant='outlined'>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant='h6'>{title}</Typography>
              <Typography variant='body2' color='text.secondary'>{help}</Typography>
            </Box>

            <Box
              sx={{
                minHeight: 130,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: theme => `1px dashed ${theme.palette.divider}`,
                borderRadius: 1,
                p: 2
              }}
            >
              {value ? (
                <Box
                  component='img'
                  src={`${value}&v=${encodeURIComponent(branding.updatedAt || '')}`}
                  alt={title}
                  sx={{ maxHeight: 110, maxWidth: '100%', objectFit: 'contain' }}
                />
              ) : (
                <Typography variant='body2' color='text.secondary'>No logo uploaded</Typography>
              )}
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                component='label'
                variant='contained'
                disabled={busy === slot}
                startIcon={busy === slot ? <CircularProgress size={16} /> : <i className='tabler-upload' />}
              >
                Upload Logo
                <input
                  hidden
                  type='file'
                  accept='image/png,image/jpeg,image/webp'
                  onChange={event => upload(slot, event)}
                />
              </Button>

              {value && (
                <Button
                  variant='outlined'
                  color='error'
                  disabled={busy === slot}
                  onClick={() => remove(slot)}
                >
                  Remove
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  return (
    <Stack spacing={3} sx={{ mb: 3 }}>
      <Box>
        <Typography variant='h5'>Demo Branding</Typography>
        <Typography variant='body2' color='text.secondary'>
          Upload customer or department branding for this demo. Files are stored with the demo installation,
          not in browser storage.
        </Typography>
      </Box>

      {message && <Alert severity='success' variant='outlined'>{message}</Alert>}
      {error && <Alert severity='error' variant='outlined'>{error}</Alert>}

      <Alert severity='info' variant='outlined'>
        PNG, JPG, and WEBP are supported. Maximum size is 4 MB per logo. Branding survives browser restarts,
        server restarts, computer reboots, and localhost port changes.
      </Alert>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          {renderSlot(
            'primaryLogo',
            'Primary Agency Logo',
            'The department, agency, or customer logo shown beside the Forge Responder wordmark.'
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          {renderSlot(
            'secondaryLogo',
            'Secondary Logo / Patch',
            'Optional department patch, seal, alternate logo, or customer mark kept with the demo.'
          )}
        </Grid>
      </Grid>
    </Stack>
  )
}
