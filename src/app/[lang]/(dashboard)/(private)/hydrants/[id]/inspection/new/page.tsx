import { notFound } from 'next/navigation'
import PageHeader from '@views/forge-responder/PageHeader'
import HydrantInspectionWizard from '@views/forge-responder/HydrantInspectionWizard'
import { getHydrant } from '@/lib/forge-platform/hydrants'

export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params
  let hydrant:any;try{hydrant=(await getHydrant(id)).data}catch{return notFound()}
  return <div><PageHeader title='Hydrant Inspection' description='Condition, operability, access, and repair needs.'/><HydrantInspectionWizard hydrant={hydrant}/></div>
}
