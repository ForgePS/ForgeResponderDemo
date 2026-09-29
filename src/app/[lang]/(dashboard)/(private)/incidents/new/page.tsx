import PageHeader from '@views/forge-responder/PageHeader'
import IncidentWizard from '@views/forge-responder/IncidentWizard'
import { loadForgeSeed } from '@/utils/forgeSeed'

export default function NewIncidentPage() {
  const apparatus=loadForgeSeed<any[]>('apparatus')
  const personnel=loadForgeSeed<any[]>('personnel')
  return <div><PageHeader title='New Demo Incident' description='Dispatch, staffing, operations, narrative, and officer review.'/><IncidentWizard apparatus={apparatus} personnel={personnel}/></div>
}
