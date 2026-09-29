import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import { loadForgeSeed } from '@/utils/forgeSeed'

export default function DashboardPage({params}:{params:Promise<{lang:string}>}) {
  const hydrants=loadForgeSeed<any[]>('hydrants')
  const personnel=loadForgeSeed<any[]>('personnel')
  const apparatus=loadForgeSeed<any[]>('apparatus')
  const occupancies=loadForgeSeed<any[]>('occupancies')
  const activity=loadForgeSeed<any[]>('activity-events').slice(0,8)
  const oos=hydrants.filter(h=>h.status==='Out of Service').length
  const repair=hydrants.filter(h=>h.status==='Needs Repair').length
  const paramedics=personnel.filter(p=>String(p.ems).toLowerCase().includes('paramedic')).length

  return <div>
    <PageHeader title='Command Dashboard' description='Operational overview for the Forge Responder Demo Department.'/>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
      <StatCard label='Hydrants' value={hydrants.length} detail={`${oos} out of service · ${repair} need repair`} icon='tabler-droplet' color='info'/>
      <StatCard label='Personnel' value={personnel.length} detail={`${paramedics} paramedic credential records`} icon='tabler-users' color='success'/>
      <StatCard label='Apparatus' value={apparatus.length} detail='Source-backed fleet assets' icon='tabler-truck' color='warning'/>
      <StatCard label='Occupancies' value={occupancies.length} detail='Prevention / preplan records' icon='tabler-building' color='error'/>
    </Box>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'1.3fr .7fr'},gap:3}}>
      <Card><CardContent>
        <Box className='flex items-center justify-between gap-4 mbe-4'><div><Typography variant='h5'>Operational Readiness</Typography><Typography color='text.secondary'>High-value trade-show entry points</Typography></div></Box>
        {[['Water Supply',`${hydrants.length-oos}/${hydrants.length} available`,'/hydrants','tabler-droplet'],['Personnel',`${personnel.length} roster records`,'/personnel','tabler-users'],['Fleet',`${apparatus.length} apparatus records`,'/apparatus','tabler-truck'],['Prevention',`${occupancies.length} occupancies`,'/occupancies','tabler-shield-check']].map(([label,value,href,icon],i)=><div key={href}><Box className='flex items-center justify-between gap-4 py-3'><Box className='flex items-center gap-3'><i className={`${icon} text-2xl text-primary`}/><div><Typography fontWeight={700}>{label}</Typography><Typography variant='body2' color='text.secondary'>{value}</Typography></div></Box><Button href={href} size='small' variant='tonal'>Open</Button></Box>{i<3?<Divider/>:null}</div>)}
      </CardContent></Card>
      <Card><CardContent><Typography variant='h5'>Recent Activity</Typography><Typography color='text.secondary' className='mbe-4'>Source-backed event stream</Typography>
        <div className='flex flex-col gap-3'>{activity.map((a:any)=><Box key={a.id} className='flex items-start gap-3'><i className='tabler-activity text-error mt-1'/><div><Typography fontWeight={600}>{a.recordType || 'Activity'}</Typography><Typography variant='caption' color='text.secondary'>{[a.shift,a.status,a.occurredAt?.slice(0,10)].filter(Boolean).join(' · ')}</Typography></div></Box>)}</div>
      </CardContent></Card>
    </Box>
  </div>
}
