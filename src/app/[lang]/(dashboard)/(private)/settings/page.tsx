import Box from '@mui/material/Box'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import AdminSettingsPanel from '@views/forge-responder/AdminSettingsPanel'
import { loadForgeSeed } from '@/utils/forgeSeed'
import DemoBrandingSettings from '@/components/forge-responder/DemoBrandingSettings'

export default function SettingsPage() {
  const roles=loadForgeSeed<any[]>('roles')
  const dropdowns=loadForgeSeed<any[]>('dropdowns')
  const lists=loadForgeSeed<any[]>('lists')
  return <div>
    <PageHeader title='Administration & Settings' description='Tenant settings, modules, roles, permissions, and configurable values.'/>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
      <StatCard label='Roles' value={roles.length} detail='Source-backed role records' icon='tabler-shield-lock' color='error'/>
      <StatCard label='Dropdown Records' value={dropdowns.length} detail='Source-backed configurable values' icon='tabler-list' color='info'/>
      <StatCard label='Lists' value={lists.length} detail='Source-backed operational lists' icon='tabler-table' color='success'/>
      <StatCard label='Tenant' value='forge-demo' detail='Standalone sanitized environment' icon='tabler-building-community' color='warning'/>
    </Box>
    <DemoBrandingSettings />
    <AdminSettingsPanel roles={roles}/>
  </div>
}
