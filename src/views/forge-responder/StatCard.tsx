import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

export default function StatCard({label,value,detail,icon,color='primary'}:{label:string;value:string|number;detail:string;icon:string;color?:'primary'|'error'|'warning'|'success'|'info'}) {
  return <Card><CardContent>
    <Box className='flex items-start justify-between gap-4'>
      <div><Typography variant='body2' color='text.secondary'>{label}</Typography><Typography variant='h4' className='mt-1'>{value}</Typography><Typography variant='caption' color='text.secondary'>{detail}</Typography></div>
      <Box className={`flex items-center justify-center rounded-lg bg-${color}/10 text-${color}`} sx={{width:42,height:42}}><i className={`${icon} text-2xl`}/></Box>
    </Box>
  </CardContent></Card>
}
