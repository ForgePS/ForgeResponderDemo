import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

export default function PageHeader({title,description}:{title:string;description:string}) {
  return <Box className='flex flex-wrap items-end justify-between gap-4 mbe-6'>
    <div><Typography variant='h4'>{title}</Typography><Typography color='text.secondary' className='mt-1'>{description}</Typography></div>
    <Chip color='error' variant='tonal' icon={<i className='tabler-flame'/>} label='Forge Responder Demo'/>
  </Box>
}
