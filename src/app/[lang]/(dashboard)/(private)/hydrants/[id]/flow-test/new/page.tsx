import { notFound } from 'next/navigation'
import PageHeader from '@views/forge-responder/PageHeader'
import HydrantFlowTestWizard from '@views/forge-responder/HydrantFlowTestWizard'
import { loadForgeSeed } from '@/utils/forgeSeed'

export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params
  const hydrant=loadForgeSeed<any[]>('hydrants').find(h=>h.id===id)
  if(!hydrant) notFound()
  return <div><PageHeader title='New Hydrant Flow Test' description='Pressure readings, calculated flow, classification, and review.'/><HydrantFlowTestWizard hydrant={hydrant}/></div>
}
