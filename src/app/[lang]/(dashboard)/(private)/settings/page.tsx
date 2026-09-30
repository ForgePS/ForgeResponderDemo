import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import AdminSettingsPanel from '@views/forge-responder/AdminSettingsPanel'
import { loadForgeSeed } from '@/utils/forgeSeed'
import DemoBrandingSettings from '@/components/forge-responder/DemoBrandingSettings'

export default async function SettingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const roles = loadForgeSeed<any[]>('roles')
  const dropdowns = loadForgeSeed<any[]>('dropdowns')
  const lists = loadForgeSeed<any[]>('lists')

  return (
    <div>
      <PageHeader
        title='Administration & Settings'
        description='Tenant settings, modules, roles, permissions, configurable values, and RMS master data.'
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', xl: 'repeat(4,1fr)' }, gap: 3, mb: 3 }}>
        <StatCard label='Roles' value={roles.length} detail='Source-backed role records' icon='tabler-shield-lock' color='error' />
        <StatCard label='Dropdown Records' value={dropdowns.length} detail='Source-backed configurable values' icon='tabler-list' color='info' />
        <StatCard label='Lists' value={lists.length} detail='Source-backed operational lists' icon='tabler-table' color='success' />
        <StatCard label='Tenant' value='forge-demo' detail='Dual-mode Forge environment' icon='tabler-building-community' color='warning' />
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant='h5'>RMS Master Data</Typography>
              <Typography color='text.secondary'>
                Manage stations, shifts, apparatus, and units through the Forge Platform integration layer.
              </Typography>
            </Box>
            <Button href={`/${lang}/settings/master-data`} variant='contained' color='error'>
              Open Master Data
            </Button>
          </Box>
        </CardContent>
      </Card>

      <DemoBrandingSettings />
      <AdminSettingsPanel roles={roles} />
    </div>
  )
}
