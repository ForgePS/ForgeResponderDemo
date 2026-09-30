import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import { notFound } from 'next/navigation'
import PageHeader from '@views/forge-responder/PageHeader'
import { getRmsMasterData } from '@/lib/forge-platform/rms'
type Preplan={id:string;occupancyId?:string|null;versionLabel?:string;version?:number;approvalStatus?:string;publicationStatus?:string;tacticalSummary?:string|null;hazards?:string|null;accessNotes?:string|null;utilityNotes?:string|null;primaryStationId?:string|null;updatedAt?:string;notes?:string|null}
type Occupancy={id:string;name?:string;addressLine1?:string|null;address?:string|null;city?:string|null;state?:string|null}
const S=({title,value}:{title:string;value?:string|null})=><Card><CardContent><Typography variant='h5' sx={{mb:2}}>{title}</Typography><Typography color={value?'text.primary':'text.secondary'} sx={{whiteSpace:'pre-wrap'}}>{value||'No information recorded.'}</Typography></CardContent></Card>
export default async function PreplanDetailPage({params}:{params:Promise<{lang:string,id:string}>}){
 const {lang,id}=await params; let result
 try{result=await getRmsMasterData<Preplan>('preplans',id)}catch{notFound()}
 const row=result.data; let occupancy:Occupancy|undefined
 if(row.occupancyId){try{occupancy=(await getRmsMasterData<Occupancy>('occupancies',row.occupancyId)).data}catch{}}
 const status=row.approvalStatus||row.publicationStatus||'DRAFT'; const approved=String(status).toUpperCase()==='APPROVED'||String(status).toLowerCase()==='published'
 return <div><Box sx={{mb:2}}><Button href={`/${lang}/preplans`} startIcon={<i className='tabler-arrow-left'/>}>Preplans</Button></Box><PageHeader title={occupancy?.name||'Responder Preplan'} description={[occupancy?.addressLine1||occupancy?.address,occupancy?.city,occupancy?.state].filter(Boolean).join(', ')||'Responder pre-incident plan detail'}/>
 <Alert severity={result.source==='platform'?'success':'info'} variant='outlined' sx={{mb:3}}>{result.source==='platform'?'Live Forge Platform preplan record.':'Persistent standalone demo preplan record.'}</Alert>
 <Card sx={{mb:3}}><CardContent><Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:2,flexWrap:'wrap'}}><Box><Typography variant='h5'>Plan Status</Typography><Typography color='text.secondary'>Version {row.versionLabel||row.version||1} · Updated {row.updatedAt?new Date(row.updatedAt).toLocaleDateString():'Not recorded'}</Typography></Box><Chip variant='tonal' color={approved?'success':'warning'} label={String(status).replaceAll('_',' ')}/></Box><Divider sx={{my:3}}/><Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',lg:'repeat(4,1fr)'},gap:3}}>{[['Occupancy',occupancy?.name],['Occupancy ID',row.occupancyId],['Primary Station',row.primaryStationId],['Data Source',result.source==='platform'?'Forge Platform':'Demo Persistence']].map(([label,value])=><Box key={String(label)}><Typography variant='caption' color='text.secondary'>{label}</Typography><Typography fontWeight={600}>{value||'Not recorded'}</Typography></Box>)}</Box></CardContent></Card>
 <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'repeat(2,1fr)'},gap:3}}><S title='Access Notes' value={row.accessNotes}/><S title='Utility Notes' value={row.utilityNotes}/><S title='Hazards' value={row.hazards}/><S title='Tactical Summary' value={row.tacticalSummary||row.notes}/></Box>
 {occupancy?<Box sx={{display:'flex',gap:2,flexWrap:'wrap',mt:3}}><Button href={`/${lang}/occupancies/${occupancy.id}`} variant='outlined'>Open Occupancy</Button><Button href={`/${lang}/hydrants`} variant='tonal'>View Water Supply</Button></Box>:null}</div>
}