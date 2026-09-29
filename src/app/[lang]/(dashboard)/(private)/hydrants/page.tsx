import Button from '@mui/material/Button'
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

export default async function HydrantsPage({params}:{params:Promise<{lang:string}>}){ const {lang}=await params;
 const rows=loadForgeSeed<any[]>('hydrants'); const inService=rows.filter(r=>r.status==='In Service').length; const oos=rows.filter(r=>r.status==='Out of Service').length; const repair=rows.filter(r=>r.status==='Needs Repair').length;
 return <div><PageHeader title='Hydrants' description='Water supply readiness, flow testing, inspections, damage, and ownership.'/><Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}><StatCard label='Hydrants' value={rows.length} detail='Source-backed demo records' icon='tabler-droplet' color='info'/><StatCard label='In Service' value={inService} detail='Available for operations' icon='tabler-circle-check' color='success'/><StatCard label='Out of Service' value={oos} detail='Operational awareness' icon='tabler-alert-triangle' color='error'/><StatCard label='Needs Repair' value={repair} detail='Maintenance attention' icon='tabler-tool' color='warning'/></Box>
 <Card><CardContent><Typography variant='h5'>Hydrant Registry</Typography><Typography color='text.secondary' className='mbe-4'>Showing the first 75 records from the sanitized source export.</Typography><TableContainer><Table size='small'><TableHead><TableRow><TableCell>Hydrant</TableCell><TableCell>Address</TableCell><TableCell>District</TableCell><TableCell>Status</TableCell><TableCell>NFPA</TableCell><TableCell align='right'>Flow</TableCell><TableCell align='right'>Action</TableCell></TableRow></TableHead><TableBody>{rows.slice(0,75).map(r=><TableRow hover key={r.id}><TableCell><Typography fontWeight={700}>{r.displayId||r.id}</Typography></TableCell><TableCell>{r.address}</TableCell><TableCell>{r.district||'—'}</TableCell><TableCell><Chip size='small' color={r.status==='In Service'?'success':r.status==='Out of Service'?'error':'warning'} variant='tonal' label={r.status}/></TableCell><TableCell>{r.nfpaClass||'—'}</TableCell><TableCell align='right'>{r.flowGpm?`${Math.round(r.flowGpm)} GPM`:'—'}</TableCell><TableCell align='right'><Button href={`/${lang}/hydrants/${r.id}`} size='small'>Open</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card></div>
}
