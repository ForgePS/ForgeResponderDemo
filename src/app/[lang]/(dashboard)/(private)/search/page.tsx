import Box from '@mui/material/Box'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import OperationalSearch from '@views/forge-responder/OperationalSearch'
import { loadForgeSeed } from '@/utils/forgeSeed'

export default async function SearchPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params
  const hydrants=loadForgeSeed<any[]>('hydrants')
  const personnel=loadForgeSeed<any[]>('personnel')
  const apparatus=loadForgeSeed<any[]>('apparatus')
  const occupancies=loadForgeSeed<any[]>('occupancies')
  const preplans=loadForgeSeed<any[]>('preplans')

  const records=[
    ...hydrants.map(r=>({
      id:r.id,module:'Hydrant',title:r.displayId||r.id,
      subtitle:[r.address,`District ${r.district||'—'}`,r.flowGpm?`${Math.round(r.flowGpm)} GPM`:null].filter(Boolean).join(' · '),
      status:r.status,
      keywords:[r.address,r.city,r.district,r.nfpaClass,r.nfpaColor,r.waterProvider],
      href:`/${lang}/hydrants/${r.id}`
    })),
    ...personnel.map(r=>({
      id:r.id,module:'Personnel',title:r.displayName||r.id,
      subtitle:[r.rank,r.shift,r.station,r.assignment].filter(Boolean).join(' · '),
      status:r.status,
      keywords:[r.firstName,r.lastName,r.rank,r.position,r.shift,r.station,r.assignment,r.unit,r.ems,r.agencyPersonnelId],
      href:`/${lang}/personnel/${r.id}`
    })),
    ...apparatus.map(r=>({
      id:r.id,module:'Apparatus',title:r.unitNumber||r.id,
      subtitle:[r.assetType,r.station,r.make,r.model].filter(Boolean).join(' · '),
      status:r.status,
      keywords:[r.unitNumber,r.assetType,r.class,r.station,r.make,r.model,r.maintenanceStatus],
      href:`/${lang}/apparatus/${r.id}`
    })),
    ...occupancies.map(r=>({
      id:r.id,module:'Occupancy',title:r.name||r.id,
      subtitle:[r.address,r.occupancyType,r.city].filter(Boolean).join(' · '),
      status:r.status,
      keywords:[r.name,r.address,r.city,r.occupancyType,r.constructionType],
      href:`/${lang}/occupancies/${r.id}`
    })),
    ...preplans.map(r=>({
      id:r.id,module:'Preplan',title:r.title||r.id,
      subtitle:[r.occupancyUse,r.buildingConstruction,`Version ${r.version||1}`].filter(Boolean).join(' · '),
      status:r.publicationStatus,
      keywords:[r.title,r.occupancyUse,r.buildingConstruction,r.reviewStatus],
      href:`/${lang}/preplans/${r.id}`
    }))
  ]

  return <div>
    <PageHeader title='Operational Search' description='One search across water supply, personnel, apparatus, occupancies, and preplans.'/>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(5,1fr)'},gap:3,mb:3}}>
      <StatCard label='Hydrants' value={hydrants.length} detail='Searchable records' icon='tabler-droplet' color='info'/>
      <StatCard label='Personnel' value={personnel.length} detail='Searchable records' icon='tabler-users' color='success'/>
      <StatCard label='Apparatus' value={apparatus.length} detail='Searchable records' icon='tabler-truck' color='warning'/>
      <StatCard label='Occupancies' value={occupancies.length} detail='Searchable records' icon='tabler-building' color='error'/>
      <StatCard label='Preplans' value={preplans.length} detail='Searchable records' icon='tabler-map-2' color='info'/>
    </Box>
    <OperationalSearch records={records}/>
  </div>
}
