import PageHeader from '@views/forge-responder/PageHeader'
import PreplanBuilder from '@views/forge-responder/PreplanBuilder'
import { listRmsMasterData } from '@/lib/forge-platform/rms'
type Occupancy={id:string;name?:string;addressLine1?:string|null;address?:string|null;recordVersion?:number}
type Station={id:string;name?:string;stationNumber?:string}
export default async function NewPreplanPage({params,searchParams}:{params:Promise<{lang:string}>;searchParams:Promise<{occupancy?:string}>}){
 const [{lang},{occupancy},occupancyResult,stationResult]=await Promise.all([params,searchParams,listRmsMasterData<Occupancy>('occupancies'),listRmsMasterData<Station>('stations')])
 return <div><PageHeader title='New Preplan' description='Create a responder pre-incident plan using the Forge Responder workflow.'/><PreplanBuilder occupancies={occupancyResult.data} stations={stationResult.data} initialOccupancyId={occupancy} lang={lang}/></div>
}