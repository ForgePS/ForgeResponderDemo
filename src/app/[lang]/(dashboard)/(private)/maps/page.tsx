import Alert from '@mui/material/Alert'
import PageHeader from '@views/forge-responder/PageHeader'
import HydrantMapbox from '@views/forge-responder/HydrantMapbox'
import { listHydrants } from '@/lib/forge-platform/hydrants'

export default async function MapsPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params
  const hydrants=(await listHydrants()).data
  return <div>
    <PageHeader title='Operational GIS Map' description='Live Mapbox hydrant layer using the sanitized source-backed latitude and longitude values.'/>
    <HydrantMapbox hydrants={hydrants} lang={lang} accessToken={process.env.MAPBOX_ACCESS_TOKEN}/>
    <Alert severity='info' variant='outlined' sx={{mt:3}}>
      Hydrant locations use stored hydrant coordinates. Occupancy and apparatus layers remain separate until source-backed GIS coordinates exist for those domains.
    </Alert>
  </div>
}
