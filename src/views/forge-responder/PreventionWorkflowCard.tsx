import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
export default function PreventionWorkflowCard({
  title, description, icon, href, count, action='Open'
}:{
  title:string
  description:string
  icon:string
  href:string
  count?:number|string
  action?:string
}) {
  return (
    <Card sx={{height:'100%'}}>
      <CardContent sx={{height:'100%',display:'flex',flexDirection:'column'}}>
        <Box sx={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:2}}>
          <Box sx={{width:44,height:44,borderRadius:2,display:'grid',placeItems:'center',bgcolor:'error.lightOpacity',color:'error.main'}}>
            <i className={`${icon} text-2xl`} />
          </Box>
          {count !== undefined ? <Typography variant='h4'>{count}</Typography> : null}
        </Box>
        <Typography variant='h5' sx={{mt:3}}>{title}</Typography>
        <Typography color='text.secondary' sx={{mt:1,mb:3,flexGrow:1}}>{description}</Typography>
        <Button href={href} variant='tonal' color='error' endIcon={<i className='tabler-arrow-right'/>}>
          {action}
        </Button>
      </CardContent>
    </Card>
  )
}
