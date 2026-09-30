import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import NerisValidationCenter from '@views/forge-responder/NerisValidationCenter'
import NerisSchemaDashboard from '@views/forge-responder/NerisSchemaDashboard'
import { nerisCatalog, nerisModules } from '@/utils/nerisSchema'
import { listIncidents } from '@/lib/forge-platform/incidents'

export default async function NerisPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params
  const s=nerisCatalog.summary
  const incidents=(await listIncidents()).data

  return (
    <div>
      <Box sx={{display:'flex',justifyContent:'flex-end',gap:2,mb:2}}>
        <Button href={`/${lang}/neris/value-sets`} variant='tonal' startIcon={<i className='tabler-list-check'/>}>Value Sets</Button>
        <Button href={`/${lang}/incidents/new`} variant='contained' color='error' startIcon={<i className='tabler-plus'/>}>Create Incident</Button>
      </Box>
      <PageHeader title='NERIS' description='Schema-driven NERIS module catalog, field rules, coded value sets, and validation readiness.' />

      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
        <StatCard label='NERIS Modules' value={s.moduleCount} detail='Core + Secondary modules' icon='tabler-box-multiple' color='error'/>
        <StatCard label='Schema Fields' value={s.fieldCount} detail='Parsed from uploaded workbooks' icon='tabler-list-details' color='info'/>
        <StatCard label='Value Sets' value={s.valueSetCount} detail={`${s.valueOptionCount} coded options`} icon='tabler-list-check' color='success'/>
        <StatCard label='Conditional Fields' value={s.conditionalFieldCount} detail={`${s.computedFieldCount} computed fields`} icon='tabler-git-branch' color='warning'/>
      </Box>

      <Alert severity='success' variant='outlined' sx={{mb:3}}>
        This catalog is generated directly from the uploaded NERIS V1 Core and Secondary schema workbooks and is the source of truth for this demo.
      </Alert>

      <Box sx={{mb:4}}><NerisValidationCenter incidents={incidents} /></Box>
      <NerisSchemaDashboard modules={nerisModules} lang={lang}/>
    </div>
  )
}
