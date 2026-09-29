import { notFound } from 'next/navigation'
import PageHeader from '@views/forge-responder/PageHeader'
import HydrantDamageWizard from '@views/forge-responder/HydrantDamageWizard'
import { loadForgeSeed } from '@/utils/forgeSeed'

export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params
  const hydrant=loadForgeSeed<any[]>('hydrants').find(h=>h.id===id)
  if(!hydrant) notFound()
  return <div><PageHeader title='Report Hydrant Damage' description='Severity, operational status, alternate supply, and repair routing.'/><HydrantDamageWizard hydrant={hydrant}/></div>
}
