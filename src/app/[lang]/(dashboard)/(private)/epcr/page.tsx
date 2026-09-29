import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import PageHeader from '@views/forge-responder/PageHeader'
import SourceBoundaryAlert from '@views/forge-responder/SourceBoundaryAlert'

export default async function EpcrPage({params}:{params:Promise<{lang:string}>}) {
  const {lang}=await params
  return (
    <div>
      <PageHeader title='ePCR' description='Electronic patient-care reporting workflow for response, assessment, treatment, disposition, and review.' />
      <Card sx={{mb:3}}><CardContent>
        <Typography variant='h5'>Patient-Care Workflow</Typography>
        <Typography color='text.secondary' sx={{mt:1,mb:3}}>Launch a browser-local ePCR demonstration. NEMSIS transmission is disabled.</Typography>
        <Button href={`/${lang}/epcr/new`} variant='contained' color='error' startIcon={<i className='tabler-plus'/>}>Start Demo ePCR</Button>
      </CardContent></Card>
      <SourceBoundaryAlert>No source-backed ePCR collection was present in the export. This page intentionally does not fabricate historical patient-care records.</SourceBoundaryAlert>
    </div>
  )
}
