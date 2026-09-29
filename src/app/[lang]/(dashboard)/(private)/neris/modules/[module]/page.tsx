import { notFound } from 'next/navigation'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
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
import Alert from '@mui/material/Alert'
import PageHeader from '@views/forge-responder/PageHeader'
import StatCard from '@views/forge-responder/StatCard'
import { fieldRequirement, getNerisModule, humanizeNerisName, nerisValueSets } from '@/utils/nerisSchema'

export default async function NerisModulePage({params}:{params:Promise<{lang:string,module:string}>}) {
  const {lang,module}=await params
  const schema=getNerisModule(module)
  if(!schema) notFound()

  const conditional=schema.fields.filter(f=>Boolean(f.possible_if)).length
  const computed=schema.fields.filter(f=>Boolean(f.computed)).length
  const required=schema.fields.filter(f=>Boolean(f.db_required)).length
  const valueRefs=schema.fields.filter(f=>Boolean(f.value_set)).length

  return (
    <div>
      <Box sx={{mb:2}}><Button href={`/${lang}/neris`} startIcon={<i className='tabler-arrow-left'/>}>NERIS Catalog</Button></Box>
      <PageHeader title={humanizeNerisName(schema.module)} description={`${schema.module} · ${schema.workbook}`} />
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',xl:'repeat(4,1fr)'},gap:3,mb:3}}>
        <StatCard label='Fields' value={schema.fieldCount} detail='Schema-defined fields' icon='tabler-list-details' color='error'/>
        <StatCard label='Conditional' value={conditional} detail='possible_if rules' icon='tabler-git-branch' color='warning'/>
        <StatCard label='Computed' value={computed} detail='Computed fields' icon='tabler-calculator' color='info'/>
        <StatCard label='Value Set Refs' value={valueRefs} detail={`${required} database-required fields`} icon='tabler-list-check' color='success'/>
      </Box>

      <Alert severity='info' variant='outlined' sx={{mb:3}}>Field definitions below come directly from the uploaded NERIS V1 workbook for this module.</Alert>

      <Card>
        <CardContent>
          <Typography variant='h5' sx={{mb:2}}>Field Schema</Typography>
          <TableContainer>
            <Table size='small'>
              <TableHead><TableRow><TableCell>Field</TableCell><TableCell>Type</TableCell><TableCell>Group</TableCell><TableCell>Requirement</TableCell><TableCell>Cardinality</TableCell><TableCell>Value Set</TableCell><TableCell>Description</TableCell></TableRow></TableHead>
              <TableBody>
                {schema.fields.map((field,index)=>{
                  const req=fieldRequirement(field)
                  const vs=typeof field.value_set_location==='string' ? field.value_set_location.trim() : ''
                  const localValueSet=vs ? nerisValueSets[vs] : undefined
                  return (
                    <TableRow hover key={`${field.name}-${index}`}>
                      <TableCell>
                        <Typography fontWeight={700}>{String(field.name || 'Unnamed')}</Typography>
                        {field.possible_if ? <Typography variant='caption' color='warning.main' display='block'>If: {String(field.possible_if)}</Typography> : null}
                        {field.computed_from ? <Typography variant='caption' color='info.main' display='block'>From: {String(field.computed_from)}</Typography> : null}
                      </TableCell>
                      <TableCell>{String(field.type || '—')}</TableCell>
                      <TableCell>{String(field.group || '—')}</TableCell>
                      <TableCell><Chip size='small' variant='tonal' color={req==='Computed'?'info':req==='Database Required'?'error':req==='Conditional'?'warning':'default'} label={req}/></TableCell>
                      <TableCell>{String(field.cardinality || '—')}</TableCell>
                      <TableCell>{vs ? <Box><Typography variant='body2'>{vs}</Typography>{localValueSet ? <Typography variant='caption' color='text.secondary'>{localValueSet.optionCount} options</Typography> : null}</Box> : '—'}</TableCell>
                      <TableCell sx={{minWidth:280}}>{String(field.description || '—')}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </div>
  )
}
