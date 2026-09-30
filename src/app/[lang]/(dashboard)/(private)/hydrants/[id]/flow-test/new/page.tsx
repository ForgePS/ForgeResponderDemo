import { notFound } from 'next/navigation'
import PageHeader from '@views/forge-responder/PageHeader'
import HydrantFlowTestWizard from '@views/forge-responder/HydrantFlowTestWizard'
import { getHydrant } from '@/lib/forge-platform/hydrants'

export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params
  let hydrant:any;try{hydrant=(await getHydrant(id)).data}catch{return notFound()}
  return <div><PageHeader title='New Hydrant Flow Test' description='Pressure readings, calculated flow, classification, and review.'/><HydrantFlowTestWizard hydrant={hydrant}/></div>
}
