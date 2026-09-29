import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import { loadForgeSeed } from '@/utils/forgeSeed'

export default function PersonnelPage(){
 const rows=loadForgeSeed<any[]>('personnel'); const active=rows.filter(r=>r.status==='Active').length; const medics=rows.filter(r=>String(r.ems).toLowerCase().includes('paramedic')).length; const officers=rows.filter(r=>/lieutenant|captain|chief/i.test(String(r.rank))).length;
 return <div><PageHeader title='Personnel' description='Roster, assignments, EMS credentials, certifications, and qualifications.'/><Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}><StatCard label='Personnel' value={rows.length} detail='Sanitized source-backed roster' icon='tabler-users' color='primary'/><StatCard label='Active' value={active} detail='Active personnel records' icon='tabler-user-check' color='success'/><StatCard label='Paramedics' value={medics} detail='EMS credential level' icon='tabler-heart-rate-monitor' color='error'/><StatCard label='Officers' value={officers} detail='Lieutenant and above' icon='tabler-shield-star' color='warning'/></Box>
 <Card><CardContent><Typography variant='h5'>Personnel Roster</Typography><Typography color='text.secondary' className='mbe-4'>Source identities are sanitized; operational rank, shift, station, EMS, and assignment fields are preserved.</Typography><TableContainer><Table size='small'><TableHead><TableRow><TableCell>Name</TableCell><TableCell>Rank</TableCell><TableCell>Shift</TableCell><TableCell>Station</TableCell><TableCell>Assignment</TableCell><TableCell>EMS</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{rows.map(r=><TableRow hover key={r.id}><TableCell><Typography fontWeight={700}>{r.displayName}</Typography><Typography variant='caption' color='text.secondary'>{r.agencyPersonnelId}</Typography></TableCell><TableCell>{r.rank}</TableCell><TableCell>{r.shift}</TableCell><TableCell>{r.station}</TableCell><TableCell>{r.assignment}</TableCell><TableCell><Chip size='small' variant='tonal' color={String(r.ems).toLowerCase().includes('paramedic')?'error':'info'} label={r.ems||'None'}/></TableCell><TableCell>{r.status}</TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card></div>
}
