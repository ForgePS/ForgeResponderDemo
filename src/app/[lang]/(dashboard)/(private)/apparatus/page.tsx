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

export default function ApparatusPage(){
 const rows=loadForgeSeed<any[]>('apparatus'); const ready=rows.filter(r=>/in_service|ready|available/i.test(String(r.status))).length; const stations=new Set(rows.map(r=>r.station).filter(Boolean)).size;
 return <div><PageHeader title='Apparatus' description='Fleet readiness, assignments, maintenance, testing, and operational status.'/><Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}><StatCard label='Fleet Assets' value={rows.length} detail='Source-backed apparatus records' icon='tabler-truck' color='primary'/><StatCard label='Ready' value={ready} detail='Current readiness state' icon='tabler-circle-check' color='success'/><StatCard label='Stations' value={stations} detail='Assigned station locations' icon='tabler-building-community' color='info'/><StatCard label='Work Orders' value='Demo' detail='Workflow integration next' icon='tabler-tool' color='warning'/></Box>
 <Card><CardContent><Typography variant='h5'>Fleet Registry</Typography><Typography color='text.secondary' className='mbe-4'>Source-backed apparatus records from the exported RMS dataset.</Typography><TableContainer><Table size='small'><TableHead><TableRow><TableCell>Unit</TableCell><TableCell>Type</TableCell><TableCell>Station</TableCell><TableCell>Status</TableCell><TableCell>Maintenance</TableCell><TableCell align='right'>Mileage</TableCell></TableRow></TableHead><TableBody>{rows.map(r=><TableRow hover key={r.id}><TableCell><Typography fontWeight={800}>{r.unitNumber}</Typography></TableCell><TableCell>{r.assetType||r.class||'—'}</TableCell><TableCell>{r.station||'—'}</TableCell><TableCell><Chip size='small' color={/in_service|ready|available/i.test(String(r.status))?'success':'warning'} variant='tonal' label={String(r.status||'Unknown').replaceAll('_',' ')}/></TableCell><TableCell>{r.maintenanceStatus||'—'}</TableCell><TableCell align='right'>{r.mileage?Math.round(r.mileage).toLocaleString():'—'}</TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card></div>
}
