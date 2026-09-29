import { notFound } from 'next/navigation'
import PageHeader from '@views/forge-responder/PageHeader'
import HydrantInspectionWizard from '@views/forge-responder/HydrantInspectionWizard'
import { loadForgeSeed } from '@/utils/forgeSeed'

export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params
  const hydrant=loadForgeSeed<any[]>('hydrants').find(h=>h.id===id)
  if(!hydrant) notFound()
  return <div><PageHeader title='Hydrant Inspection' description='Condition, operability, access, and repair needs.'/><HydrantInspectionWizard hydrant={hydrant}/></div>
}
