import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import PageHeader from '@views/forge-responder/PageHeader'
import { humanizeNerisName, nerisValueSets } from '@/utils/nerisSchema'

export default function NerisValueSetsPage() {
  const entries=Object.entries(nerisValueSets).sort((a,b)=>a[0].localeCompare(b[0]))
  return (
    <div>
      <PageHeader title='NERIS Value Sets' description='Coded option sets parsed from the uploaded Core and Secondary schema workbooks.' />
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(2,1fr)',xl:'repeat(3,1fr)'},gap:3}}>
        {entries.map(([name,set])=>(
          <Card key={name}>
            <CardContent>
              <Box sx={{display:'flex',justifyContent:'space-between',gap:2,alignItems:'flex-start'}}>
                <div><Typography variant='h6'>{humanizeNerisName(name)}</Typography><Typography variant='caption' color='text.secondary'>{name}</Typography></div>
                <Chip size='small' variant='tonal' label={`${set.optionCount} options`}/>
              </Box>
              <Typography color='text.secondary' sx={{mt:2}}>{set.workbook}</Typography>
              <Box sx={{mt:2,display:'flex',gap:1,flexWrap:'wrap'}}>
                {set.options.slice(0,5).map((option,index)=>{
                  const label=String(option.label ?? option.name ?? option.description ?? option.value ?? option.code ?? `Option ${index+1}`)
                  return <Chip key={index} size='small' variant='outlined' label={label.slice(0,45)}/>
                })}
                {set.optionCount>5 ? <Chip size='small' label={`+${set.optionCount-5} more`}/> : null}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </div>
  )
}
