import PageHeader from '@views/forge-responder/PageHeader'
import CadOperationsDashboard from '@views/forge-responder/CadOperationsDashboard'

export default async function CadPage({params}:{params:Promise<{lang:string}>}){
  const {lang}=await params
  return (
    <div>
      <PageHeader title='CAD Operations' description='Manage CAD connections, intake health, conflicts, mappings, messages, replay, and incident linkage.'/>
      <CadOperationsDashboard lang={lang}/>
    </div>
  )
}
