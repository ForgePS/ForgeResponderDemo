import { notFound } from 'next/navigation'
import PageHeader from '@views/forge-responder/PageHeader'
import HydrantForm from '@views/forge-responder/HydrantForm'
import { loadForgeSeed } from '@/utils/forgeSeed'
export default async function EditHydrantPage({params}:{params:Promise<{lang:string,id:string}>}){const {lang,id}=await params;const hydrant=loadForgeSeed<any[]>('hydrants').find(x=>x.id===id);if(!hydrant)notFound();return <div><PageHeader title={`Edit ${hydrant.displayId||hydrant.id}`} description='Update hydrant location, ownership, and operational fields.'/><HydrantForm hydrant={hydrant} lang={lang}/></div>}
