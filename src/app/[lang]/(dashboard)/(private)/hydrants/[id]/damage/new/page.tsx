import { notFound } from 'next/navigation'
import PageHeader from '@views/forge-responder/PageHeader'
import HydrantDamageWizard from '@views/forge-responder/HydrantDamageWizard'
import { getHydrant } from '@/lib/forge-platform/hydrants'

export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params
  let hydrant:any;try{hydrant=(await getHydrant(id)).data}catch{return notFound()}
  return <div><PageHeader title='Report Hydrant Damage' description='Severity, operational status, alternate supply, and repair routing.'/><HydrantDamageWizard hydrant={hydrant}/></div>
}
