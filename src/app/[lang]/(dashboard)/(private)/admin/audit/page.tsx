import Box from '@mui/material/Box'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import EventTimeline from '@views/forge-responder/EventTimeline'
import { loadForgeSeed } from '@/utils/forgeSeed'

export default function AuditPage() {
  const source=loadForgeSeed<any[]>('audit-events')
  const rows=source.map((item,index)=>({
    id:item.id || `audit-${index}`,
    type:item.action || item.eventType || item.type || 'Audit',
    title:item.title || item.action || item.eventType || 'Audit event',
    detail:item.detail || item.description || item.resourceType || item.source || '',
    actor:item.actorName || item.userName || item.userEmail || item.user || '',
    status:item.status || item.result || '',
    occurredAt:item.occurredAt || item.createdAt || item.timestamp || ''
  }))
  const actors=new Set(rows.map(row=>row.actor).filter(Boolean)).size
  const actions=new Set(rows.map(row=>row.type).filter(Boolean)).size
  return <div>
    <PageHeader title='Audit Log' description='Searchable, read-only administrative and operational audit history.'/>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
      <StatCard label='Audit Events' value={rows.length} detail='Source-backed records' icon='tabler-history' color='info'/>
      <StatCard label='Action Types' value={actions} detail='Distinct audited actions' icon='tabler-list' color='error'/>
      <StatCard label='Actors' value={actors} detail='Distinct recorded actors' icon='tabler-users' color='success'/>
      <StatCard label='Retention' value='Read Only' detail='Demo does not modify source audit history' icon='tabler-lock' color='warning'/>
    </Box>
    <EventTimeline rows={rows}/>
  </div>
}
