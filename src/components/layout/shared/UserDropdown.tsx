'use client'

import { useState } from 'react'
import Link from 'next/link'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

const UserDropdown = () => {
  const [anchorEl,setAnchorEl]=useState<null | HTMLElement>(null)
  const open=Boolean(anchorEl)

  return <>
    <Button onClick={e=>setAnchorEl(e.currentTarget)} color='inherit' sx={{minWidth:0,p:0.5,borderRadius:'50%'}}>
      <Avatar sx={{width:38,height:38}}>FR</Avatar>
    </Button>
    <Menu anchorEl={anchorEl} open={open} onClose={()=>setAnchorEl(null)} transformOrigin={{horizontal:'right',vertical:'top'}} anchorOrigin={{horizontal:'right',vertical:'bottom'}}>
      <Box sx={{px:2,py:1.5,minWidth:220}}>
        <Typography fontWeight={700}>Forge Responder Demo</Typography>
        <Typography variant='caption' color='text.secondary'>Trade-show administrator</Typography>
      </Box>
      <Divider/>
      <MenuItem component={Link} href='/en/demo-control' onClick={()=>setAnchorEl(null)}>Demo Control</MenuItem>
      <MenuItem component={Link} href='/en/demo-readiness' onClick={()=>setAnchorEl(null)}>Demo Readiness</MenuItem>
      <MenuItem component={Link} href='/en/settings' onClick={()=>setAnchorEl(null)}>Settings</MenuItem>
    </Menu>
  </>
}

export default UserDropdown
