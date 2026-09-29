import PageHeader from '@views/forge-responder/PageHeader'
import InventoryTransactionWizard from '@views/forge-responder/InventoryTransactionWizard'
export default function InventoryTransactionPage(){return <div><PageHeader title='Inventory Transaction' description='Issue, receive, transfer, adjust, or retire inventory.'/><InventoryTransactionWizard/></div>}