import Alert from '@mui/material/Alert'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

export default function SystemSmokePage() {
  return (
    <Card>
      <CardContent>
        <Typography variant='h4'>Forge Responder System Smoke Test</Typography>
        <Alert severity='success' variant='outlined' sx={{mt:3}}>
          Shared dashboard layout rendered successfully.
        </Alert>
      </CardContent>
    </Card>
  )
}
