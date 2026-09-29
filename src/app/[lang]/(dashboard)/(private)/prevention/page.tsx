import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import PreventionWorkflowCard from '@views/forge-responder/PreventionWorkflowCard'
import SourceBoundaryAlert from '@views/forge-responder/SourceBoundaryAlert'
import { loadForgeSeed } from '@/utils/forgeSeed'

export default async function PreventionPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params
  const occupancies=loadForgeSeed<any[]>('occupancies')
  const preplans=loadForgeSeed<any[]>('preplans')
  const inspectionTypes=loadForgeSeed<any[]>('inspection-types')
  const hydrants=loadForgeSeed<any[]>('hydrants')
  const inspectionTemplates=loadForgeSeed<any[]>('inspection-templates')

  return (
    <div>
      <PageHeader title='Community Risk & Prevention' description='Occupancies, inspections, preplans, and water supply in one connected prevention workspace.' />

      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
        <StatCard label='Occupancies' value={occupancies.length} detail='Source-backed records' icon='tabler-building' color='info'/>
        <StatCard label='Preplans' value={preplans.length} detail='Source-backed plans' icon='tabler-map-2' color='error'/>
        <StatCard label='Inspection Programs' value={inspectionTypes.length} detail='Configured source programs' icon='tabler-clipboard-check' color='warning'/>
        <StatCard label='Hydrants' value={hydrants.length} detail='Water-supply records' icon='tabler-droplet' color='success'/>
      </Box>

      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
        <PreventionWorkflowCard title='Occupancies' description='Building intelligence, contacts, construction, protection systems, hazards, and prevention activity.' icon='tabler-building' href={`/${lang}/occupancies`} count={occupancies.length}/>
        <PreventionWorkflowCard title='Preplans' description='Responder-focused pre-incident plans with access, utilities, hazards, and fire-protection information.' icon='tabler-map-2' href={`/${lang}/preplans`} count={preplans.length}/>
        <PreventionWorkflowCard title='Inspections' description='Programs, templates, checklist workflows, findings, corrections, and closeout.' icon='tabler-clipboard-check' href={`/${lang}/inspections`} count={inspectionTypes.length}/>
        <PreventionWorkflowCard title='Water Supply' description='Hydrant readiness, flow testing, inspections, repairs, and operational status.' icon='tabler-droplet' href={`/${lang}/hydrants`} count={hydrants.length}/>
      </Box>

      <Alert severity='success' variant='outlined' sx={{mb:2}}>
        {inspectionTemplates.length} inspection templates are available in the sanitized source package.
      </Alert>

      <SourceBoundaryAlert>
        Source-backed records remain read-only in this trade-show build. Demo-only navigation relationships are labeled separately and never represented as factual source relationships.
      </SourceBoundaryAlert>
    </div>
  )
}
