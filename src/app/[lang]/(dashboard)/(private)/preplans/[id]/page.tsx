import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import { notFound } from 'next/navigation'
import PageHeader from '@views/forge-responder/PageHeader'
import { loadForgeSeed } from '@/utils/forgeSeed'

const Section=({title,items}:{title:string;items:any[]})=>(
  <Card>
    <CardContent>
      <Typography variant='h5' sx={{mb:2}}>{title}</Typography>
      {items.length ? <Box sx={{display:'grid',gap:1.5}}>{items.map((item,index)=><Box key={index} sx={{p:2,border:'1px solid',borderColor:'divider',borderRadius:2}}><Typography>{typeof item==='string'?item:JSON.stringify(item)}</Typography></Box>)}</Box> : <Typography color='text.secondary'>No source-backed entries recorded.</Typography>}
    </CardContent>
  </Card>
)

export default async function PreplanDetailPage({params}:{params:Promise<{lang:string,id:string}>}) {
  const {lang,id}=await params
  const row=loadForgeSeed<any[]>('preplans').find(x=>x.id===id)
  if(!row) notFound()

  return (
    <div>
      <Box sx={{mb:2}}><Button href={`/${lang}/preplans`} startIcon={<i className='tabler-arrow-left'/>}>Preplans</Button></Box>
      <PageHeader title={row.title || row.name || row.id} description='Responder pre-incident plan detail' />

      <Card sx={{mb:3}}>
        <CardContent>
          <Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:2,flexWrap:'wrap'}}>
            <Box>
              <Typography variant='h5'>Plan Status</Typography>
              <Typography color='text.secondary'>Version {row.version || 1} · Updated {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : 'Not recorded'}</Typography>
            </Box>
            <Chip variant='tonal' color={row.publicationStatus==='published'?'success':'warning'} label={row.publicationStatus || 'unpublished'}/>
          </Box>
          <Divider sx={{my:3}}/>
          <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',lg:'repeat(4,1fr)'},gap:3}}>
            {[
              ['Construction',row.buildingConstruction],
              ['Occupancy Use',row.occupancyUse],
              ['Review Status',row.reviewStatus],
              ['Reviewer',row.reviewerName]
            ].map(([label,value])=><Box key={String(label)}><Typography variant='caption' color='text.secondary'>{label}</Typography><Typography fontWeight={600}>{value || 'Not recorded'}</Typography></Box>)}
          </Box>
        </CardContent>
      </Card>

      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'repeat(2,1fr)'},gap:3}}>
        <Section title='Access Points' items={row.accessPoints || []}/>
        <Section title='Utilities' items={row.utilities || []}/>
        <Section title='Fire Protection Systems' items={row.fireProtectionSystems || []}/>
        <Section title='Hazards' items={row.hazards || []}/>
      </Box>

      <Card sx={{mt:3}}>
        <CardContent>
          <Typography variant='h5'>Tactical Notes</Typography>
          <Typography color='text.secondary' sx={{mt:1}}>{row.notes || 'No source-backed tactical narrative recorded.'}</Typography>
        </CardContent>
      </Card>
    </div>
  )
}
