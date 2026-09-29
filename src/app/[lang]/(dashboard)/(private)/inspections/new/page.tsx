import PageHeader from '@views/forge-responder/PageHeader'
import InspectionWizard from '@views/forge-responder/InspectionWizard'
import { loadForgeSeed } from '@/utils/forgeSeed'

export default function NewInspectionPage() {
  const occupancies=loadForgeSeed<any[]>('occupancies')
  const types=loadForgeSeed<any[]>('inspection-types')
  const templates=loadForgeSeed<any[]>('inspection-templates')
  return <div><PageHeader title='Demo Inspection' description='Run a template-driven inspection from setup through findings and closeout.'/><InspectionWizard occupancies={occupancies} types={types} templates={templates}/></div>
}
