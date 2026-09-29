import PageHeader from '@views/forge-responder/PageHeader'
import PreplanBuilder from '@views/forge-responder/PreplanBuilder'
import { loadForgeSeed } from '@/utils/forgeSeed'

export default function NewPreplanPage() {
  const occupancies=loadForgeSeed<any[]>('occupancies')
  return <div><PageHeader title='New Demo Preplan' description='Build a responder preplan using the native Vuexy/MUI workflow.'/><PreplanBuilder occupancies={occupancies}/></div>
}
