import PageHeader from '@views/forge-responder/PageHeader'
import TrainingCompletionPanel from '@views/forge-responder/TrainingCompletionPanel'
import { loadForgeSeed } from '@/utils/forgeSeed'
export default function TrainingCompletePage(){const personnel=loadForgeSeed<any[]>('personnel');return <div><PageHeader title='Record Training Completion' description='Instructor completion entry and evaluation.'/><TrainingCompletionPanel personnel={personnel}/></div>}