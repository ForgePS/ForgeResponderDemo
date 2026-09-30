import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import { listRmsMasterData } from '@/lib/forge-platform/rms'
type Preplan={id:string;occupancyId?:string|null;versionLabel?:string;version?:number;approvalStatus?:string;publicationStatus?:string;tacticalSummary?:string|null;hazards?:string|null}
type Occupancy={id:string;name?:string}
export default async function PreplansPage({params}:{params:Promise<{lang:string}>}){
 const {lang}=await params
 const [preplanResult,occupancyResult]=await Promise.all([listRmsMasterData<Preplan>('preplans'),listRmsMasterData<Occupancy>('occupancies')])
 const rows=preplanResult.data; const occupancyMap=new Map(occupancyResult.data.map(x=>[x.id,x.name||x.id]))
 const approved=rows.filter(r=>{const s=String(r.approvalStatus||r.publicationStatus);return s.toUpperCase()==='APPROVED'||s.toLowerCase()==='published'}).length
 return <div><PageHeader title='Preplans' description='Responder pre-incident planning for access, hazards, utilities, protection systems, and tactical awareness.'/>
 <Alert severity={preplanResult.source==='platform'?'success':'info'} variant='outlined' sx={{mb:3}}>{preplanResult.source==='platform'?'Connected to Forge Platform RMS preplans.':'Standalone demo mode — preplans persist locally through the Responder data store.'}</Alert>
 <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}><StatCard label='Preplans' value={rows.length} detail='Current records' icon='tabler-map-2' color='error'/><StatCard label='Approved' value={approved} detail='Approved / published plans' icon='tabler-circle-check' color='success'/><StatCard label='Draft / Review' value={rows.length-approved} detail='Plans still in workflow' icon='tabler-edit' color='warning'/><StatCard label='Data Source' value={preplanResult.source==='platform'?'Live':'Demo'} detail='Forge data adapter' icon='tabler-database' color='info'/></Box>
 <Box sx={{display:'flex',justifyContent:'flex-end',mb:3}}><Button href={`/${lang}/preplans/new`} variant='contained' color='error' startIcon={<i className='tabler-plus'/>}>New Preplan</Button></Box>
 <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(2,1fr)'},gap:3}}>{rows.map(row=>{const status=row.approvalStatus||row.publicationStatus||'DRAFT';const ok=String(status).toUpperCase()==='APPROVED'||String(status).toLowerCase()==='published';return <Card key={row.id}><CardContent><Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'flex-start'}}><div><Typography variant='h5'>{occupancyMap.get(String(row.occupancyId))||'Responder Preplan'}</Typography><Typography color='text.secondary'>Version {row.versionLabel||row.version||1}</Typography></div><Chip size='small' variant='tonal' color={ok?'success':'warning'} label={String(status).replaceAll('_',' ')}/></Box><Box sx={{display:'grid',gap:2,my:3}}><div><Typography variant='caption' color='text.secondary'>Tactical Summary</Typography><Typography>{row.tacticalSummary||'Not recorded'}</Typography></div><div><Typography variant='caption' color='text.secondary'>Hazards</Typography><Typography>{row.hazards||'Not recorded'}</Typography></div></Box><Button href={`/${lang}/preplans/${row.id}`} fullWidth variant='tonal'>Open Preplan</Button></CardContent></Card>})}</Box></div>
}