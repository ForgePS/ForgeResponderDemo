import Box from '@mui/material/Box'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import EventTimeline from '@views/forge-responder/EventTimeline'
import { loadForgeSeed } from '@/utils/forgeSeed'

export default function ActivityPage() {
  const source=loadForgeSeed<any[]>('activity-events')
  const rows=source.map((item,index)=>({
    id:item.id || `activity-${index}`,
    type:item.recordType || item.type || item.action || 'Activity',
    title:item.title || item.description || item.action || item.recordType || 'Operational activity',
    detail:item.detail || item.notes || item.source || '',
    actor:item.actorName || item.userName || item.user || item.createdBy || '',
    status:item.status || '',
    occurredAt:item.occurredAt || item.createdAt || item.timestamp || ''
  }))
  const types=new Set(rows.map(row=>row.type)).size
  return <div>
    <PageHeader title='Activity' description='Searchable operational activity timeline from the source-backed event stream.'/>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
      <StatCard label='Events' value={rows.length} detail='Source-backed records' icon='tabler-activity' color='info'/>
      <StatCard label='Event Types' value={types} detail='Distinct categories' icon='tabler-category' color='error'/>
      <StatCard label='Status Events' value={rows.filter(r=>r.status).length} detail='Rows with status' icon='tabler-list-check' color='success'/>
      <StatCard label='Mode' value='Read Only' detail='Source activity unchanged' icon='tabler-lock' color='warning'/>
    </Box>
    <EventTimeline rows={rows}/>
  </div>
}
