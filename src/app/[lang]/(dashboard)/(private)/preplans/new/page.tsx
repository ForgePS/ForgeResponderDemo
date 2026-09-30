import PageHeader from '@views/forge-responder/PageHeader'
import PreplanBuilder from '@views/forge-responder/PreplanBuilder'
import { listRmsMasterData } from '@/lib/forge-platform/rms'
type Occupancy={id:string;name?:string;addressLine1?:string|null;address?:string|null}
export default async function NewPreplanPage({params,searchParams}:{params:Promise<{lang:string}>;searchParams:Promise<{occupancy?:string}>}){
 const [{lang},{occupancy}]=await Promise.all([params,searchParams]); const result=await listRmsMasterData<Occupancy>('occupancies')
 return <div><PageHeader title='New Preplan' description='Create a responder pre-incident plan using the Forge Responder workflow.'/><PreplanBuilder occupancies={result.data} initialOccupancyId={occupancy} lang={lang}/></div>
}