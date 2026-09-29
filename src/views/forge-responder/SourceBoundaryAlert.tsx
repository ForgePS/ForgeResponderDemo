import Alert from '@mui/material/Alert'

export default function SourceBoundaryAlert({children}:{children:React.ReactNode}) {
  return (
    <Alert severity='info' variant='outlined' icon={<i className='tabler-database'/>}>
      {children}
    </Alert>
  )
}
