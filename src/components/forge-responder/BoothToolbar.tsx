'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

const eventKey='forge-responder-theme-demo-events'
const modeKey='forge-responder-booth-mode'

export default function BoothToolbar({lang}:{lang:string}) {
  const [count,setCount]=useState(0)
  const [boothMode,setBoothMode]=useState(false)
  const [fullScreen,setFullScreen]=useState(false)

  const refreshCount=()=>{
    try{setCount(JSON.parse(localStorage.getItem(eventKey)||'[]').length)}catch{setCount(0)}
  }

  useEffect(()=>{
    refreshCount()
    setBoothMode(localStorage.getItem(modeKey)==='1')
    const onStorage=()=>refreshCount()
    const onFs=()=>setFullScreen(Boolean(document.fullscreenElement))
    window.addEventListener('storage',onStorage)
    document.addEventListener('fullscreenchange',onFs)
    return ()=>{window.removeEventListener('storage',onStorage);document.removeEventListener('fullscreenchange',onFs)}
  },[])

  const toggleBooth=()=>{
    const next=!boothMode
    setBoothMode(next)
    localStorage.setItem(modeKey,next?'1':'0')
    document.documentElement.dataset.boothMode=next?'true':'false'
  }

  const toggleFullScreen=async()=>{
    try{
      if(!document.fullscreenElement) await document.documentElement.requestFullscreen()
      else await document.exitFullscreen()
    }catch{}
  }

  const reset=()=>{
    localStorage.removeItem(eventKey)
    setCount(0)
    window.dispatchEvent(new StorageEvent('storage'))
  }

  return (
    <Box className='forge-booth-toolbar' sx={{
      position:'fixed',right:{xs:8,md:16},bottom:{xs:8,md:16},zIndex:1400,
      display:'flex',alignItems:'center',gap:1,p:1,borderRadius:3,
      bgcolor:'background.paper',border:'1px solid',borderColor:'divider',
      boxShadow:6
    }}>
      <Chip size='small' color='error' variant={boothMode?'filled':'tonal'} label={boothMode?'BOOTH MODE':'Demo'} />
      <Chip size='small' variant='tonal' label={`${count} actions`} />
      <Tooltip title='Demo Control Center'><IconButton component={Link} href={`/${lang}/demo-control`} size='small'><i className='tabler-presentation'/></IconButton></Tooltip>
      <Tooltip title={fullScreen?'Exit Full Screen':'Full Screen'}><IconButton onClick={toggleFullScreen} size='small'><i className={fullScreen?'tabler-minimize':'tabler-maximize'}/></IconButton></Tooltip>
      <Tooltip title='Toggle Booth Mode'><IconButton onClick={toggleBooth} size='small'><i className='tabler-device-tv'/></IconButton></Tooltip>
      <Tooltip title='Reset Local Demo Actions'><Button size='small' color='error' variant='tonal' onClick={reset}>Reset</Button></Tooltip>
    </Box>
  )
}
