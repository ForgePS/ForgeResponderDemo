'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Map, Marker, NavigationControl, Popup } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'

type HydrantRecord={
  id:string
  displayId?:string
  address?:string
  district?:string
  status?:string
  nfpaClass?:string
  flowGpm?:number
  latitude?:number
  longitude?:number
}

const markerColor=(status?:string)=>{
  if(status==='Out of Service') return '#ef5350'
  if(status==='Needs Repair') return '#ffb74d'
  return '#42a5f5'
}

export default function HydrantMapbox({hydrants,lang,accessToken}:{hydrants:HydrantRecord[];lang:string;accessToken?:string}) {
  const mapRef=useRef<MapRef>(null)
  const [selected,setSelected]=useState<HydrantRecord|null>(null)

  const valid=useMemo(()=>hydrants.filter(h=>Number.isFinite(Number(h.latitude)) && Number.isFinite(Number(h.longitude))),[hydrants])
  const center=useMemo(()=>{
    if(!valid.length) return {longitude:-97.24,latitude:38.25}
    return {
      longitude:valid.reduce((a,h)=>a+Number(h.longitude),0)/valid.length,
      latitude:valid.reduce((a,h)=>a+Number(h.latitude),0)/valid.length
    }
  },[valid])

  if(!accessToken){
    return <Alert severity='warning' variant='outlined'>
      Mapbox is installed in the ThemeSelection template, but MAPBOX_ACCESS_TOKEN is not configured. Add the token to enable the live GIS map.
    </Alert>
  }

  return (
    <Card sx={{overflow:'hidden'}}>
      <Box sx={{height:{xs:520,lg:680},position:'relative'}}>
        <Map
          ref={mapRef}
          mapboxAccessToken={accessToken}
          initialViewState={{...center,zoom:13}}
          mapStyle='mapbox://styles/mapbox/dark-v11'
          attributionControl={false}
        >
          <NavigationControl position='top-right'/>
          {valid.map(h=>(
            <Marker key={h.id} longitude={Number(h.longitude)} latitude={Number(h.latitude)} anchor='center' onClick={e=>{e.originalEvent.stopPropagation();setSelected(h)}}>
              <button
                aria-label={`Open ${h.displayId || h.id}`}
                title={`${h.displayId || h.id} · ${h.status || 'Unknown status'}`}
                style={{width:18,height:18,borderRadius:'50%',border:'3px solid #fff',background:markerColor(h.status),boxShadow:'0 2px 7px rgba(0,0,0,.55)',cursor:'pointer'}}
              />
            </Marker>
          ))}
          {selected ? <Popup longitude={Number(selected.longitude)} latitude={Number(selected.latitude)} closeButton onClose={()=>setSelected(null)} anchor='bottom' offset={14}>
            <Box sx={{minWidth:220,color:'#111'}}>
              <Typography variant='h6' color='inherit'>{selected.displayId || selected.id}</Typography>
              <Typography variant='body2' color='inherit'>{selected.address || 'No address'}</Typography>
              <Box sx={{display:'flex',gap:1,flexWrap:'wrap',my:1.5}}>
                <Chip size='small' label={selected.status || 'Unknown'}/>
                {selected.nfpaClass ? <Chip size='small' label={selected.nfpaClass}/> : null}
              </Box>
              <Typography variant='body2' color='inherit'>{selected.flowGpm ? `${Math.round(selected.flowGpm)} GPM` : 'Flow not recorded'}</Typography>
              <Button component={Link} href={`/${lang}/hydrants/${selected.id}`} size='small' variant='contained' color='error' fullWidth sx={{mt:1.5}}>Open Hydrant</Button>
            </Box>
          </Popup> : null}
        </Map>
      </Box>
      <CardContent>
        <Box sx={{display:'flex',gap:2,flexWrap:'wrap',alignItems:'center'}}>
          <Typography variant='caption' color='text.secondary'>{valid.length} hydrants plotted using stored coordinates.</Typography>
          <Chip size='small' sx={{bgcolor:'#42a5f5',color:'#fff'}} label='In Service'/>
          <Chip size='small' sx={{bgcolor:'#ffb74d',color:'#111'}} label='Needs Repair'/>
          <Chip size='small' sx={{bgcolor:'#ef5350',color:'#fff'}} label='Out of Service'/>
        </Box>
      </CardContent>
    </Card>
  )
}
