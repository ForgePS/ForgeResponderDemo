import PageHeader from '@views/forge-responder/PageHeader'
import IncidentWizard from '@views/forge-responder/IncidentWizard'
import { listRmsMasterData } from '@/lib/forge-platform/rms'

type Option={id:string;name?:string;code?:string;stationNumber?:string;callSign?:string;unitNumber?:string;unitType?:string;personId?:string;displayName?:string;rank?:string}

export default async function NewIncidentPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params
  const [stations,shifts,units,personnel]=await Promise.all([
    listRmsMasterData<Option>('stations'),
    listRmsMasterData<Option>('shifts'),
    listRmsMasterData<Option>('units'),
    listRmsMasterData<Option>('personnel')
  ])
  return (
    <div>
      <PageHeader title='New Incident' description='Create the incident, assign resources, capture the initial narrative, and continue into NERIS review.'/>
      <IncidentWizard lang={lang} stations={stations.data} shifts={shifts.data} units={units.data} personnel={personnel.data}/>
    </div>
  )
}
