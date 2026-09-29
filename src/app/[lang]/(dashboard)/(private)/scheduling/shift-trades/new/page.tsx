import PageHeader from '@views/forge-responder/PageHeader'
import ShiftTradeWizard from '@views/forge-responder/ShiftTradeWizard'
import { loadForgeSeed } from '@/utils/forgeSeed'
export default function NewShiftTradePage(){const personnel=loadForgeSeed<any[]>('personnel').filter(p=>p.status==='Active');return <div><PageHeader title='Request Shift Trade' description='Request, coverage qualification, and approval review.'/><ShiftTradeWizard personnel={personnel}/></div>}