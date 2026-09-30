import { notFound } from 'next/navigation'

import PageHeader from '@views/forge-responder/PageHeader'
import IncidentWorkspace from '@views/forge-responder/IncidentWorkspace'
import { getIncident } from '@/lib/forge-platform/incidents'
import { listRmsMasterData } from '@/lib/forge-platform/rms'

type Option={id:string;name?:string;stationNumber?:string;code?:string;callSign?:string;unitNumber?:string;unitType?:string;personId?:string;displayName?:string;rank?:string}

export default async function IncidentDetailPage({params}:{params:Promise<{lang:string,id:string}>}) {
  const {lang,id}=await params
  let incident
  try{
    incident=(await getIncident(id)).data
  }catch{
    notFound()
  }

  const [stations,shifts,units,personnel]=await Promise.all([
    listRmsMasterData<Option>('stations'),
    listRmsMasterData<Option>('shifts'),
    listRmsMasterData<Option>('units'),
    listRmsMasterData<Option>('personnel')
  ])

  return (
    <div>
      <PageHeader
        title={incident.incidentNumber}
        description='Incident operations, NERIS validation, narrative, resource assignments, and officer review.'
      />
      <IncidentWorkspace
        initialIncident={incident}
        lang={lang}
        stations={stations.data}
        shifts={shifts.data}
        units={units.data}
        personnel={personnel.data}
      />
    </div>
  )
}
