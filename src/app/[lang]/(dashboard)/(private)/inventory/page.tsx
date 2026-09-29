import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import SourceBoundaryAlert from '@views/forge-responder/SourceBoundaryAlert'

export default async function InventoryPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params
  return <div>
    <PageHeader title='Inventory' description='Equipment, consumables, assignments, stock control, and transaction workflow.'/>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
      <StatCard label='Tracked Items' value={0} detail='No source inventory history' icon='tabler-box' color='info'/>
      <StatCard label='Low Stock' value={0} detail='Demo workflow only' icon='tabler-alert-triangle' color='warning'/>
      <StatCard label='Expiring Soon' value={0} detail='Demo workflow only' icon='tabler-calendar-exclamation' color='error'/>
      <StatCard label='Open Requests' value={0} detail='Demo workflow only' icon='tabler-package-export' color='success'/>
    </Box>
    <Card sx={{mb:3}}><CardContent>
      <Typography variant='h5'>Inventory Control</Typography>
      <Typography color='text.secondary' sx={{my:2}}>Demonstrate issue, receive, transfer, adjustment, lot/serial, expiration, and restock workflows.</Typography>
      <Button href={`/${lang}/inventory/transaction`} variant='contained' color='error' startIcon={<i className='tabler-arrows-exchange'/>}>New Demo Transaction</Button>
    </CardContent></Card>
    <SourceBoundaryAlert>No standalone source inventory collection was present. Inventory transactions are intentionally demo-only and browser-local.</SourceBoundaryAlert>
  </div>
}
