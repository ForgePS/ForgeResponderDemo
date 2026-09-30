import { notFound } from 'next/navigation'
import PageHeader from '@views/forge-responder/PageHeader'
import HydrantForm from '@views/forge-responder/HydrantForm'
import { getHydrant } from '@/lib/forge-platform/hydrants'
export default async function EditHydrantPage({params}:{params:Promise<{lang:string,id:string}>}){const {lang,id}=await params;let hydrant:any;try{hydrant=(await getHydrant(id)).data}catch{return notFound()};return <div><PageHeader title={`Edit ${hydrant.displayId||hydrant.id}`} description='Update hydrant location, ownership, and operational fields.'/><HydrantForm hydrant={hydrant} lang={lang}/></div>}
