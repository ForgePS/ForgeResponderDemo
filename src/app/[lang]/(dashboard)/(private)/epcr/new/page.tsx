import PageHeader from '@views/forge-responder/PageHeader'
import EpcrWizard from '@views/forge-responder/EpcrWizard'
import { loadForgeSeed } from '@/utils/forgeSeed'

export default function NewEpcrPage() {
  const apparatus=loadForgeSeed<any[]>('apparatus')
  return <div><PageHeader title='New Demo ePCR' description='Response, patient, assessment, care, disposition, and clinical review.'/><EpcrWizard apparatus={apparatus}/></div>
}
