import PageHeader from '@views/forge-responder/PageHeader'
import CadOperationsDashboard from '@views/forge-responder/CadOperationsDashboard'

export default function CadPage(){
  return (
    <div>
      <PageHeader title='CAD Operations' description='Manage CAD connections, intake health, conflicts, mappings, messages, replay, and incident linkage.'/>
      <CadOperationsDashboard/>
    </div>
  )
}
