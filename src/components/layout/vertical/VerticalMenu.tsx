'use client'

import { useParams } from 'next/navigation'
import { useTheme } from '@mui/material/styles'
import PerfectScrollbar from 'react-perfect-scrollbar'
import type { getDictionary } from '@/utils/getDictionary'
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'
import { Menu, SubMenu, MenuItem, MenuSection } from '@menu/vertical-menu'
import useVerticalNav from '@menu/hooks/useVerticalNav'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

type RenderExpandIconProps = { open?: boolean; transitionDuration?: VerticalMenuContextProps['transitionDuration'] }
type Props = { dictionary: Awaited<ReturnType<typeof getDictionary>>; scrollMenu: (container:any,isPerfectScrollbar:boolean)=>void }

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}><i className='tabler-chevron-right' /></StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }: Props) => {
  const theme=useTheme()
  const verticalNavOptions=useVerticalNav()
  const params=useParams()
  const locale=params.lang
  const { isBreakpointReached, transitionDuration }=verticalNavOptions
  const ScrollWrapper=isBreakpointReached ? 'div' : PerfectScrollbar
  const href=(path:string)=>`/${locale}${path}`

  return (
    <ScrollWrapper {...(isBreakpointReached ? { className:'bs-full overflow-y-auto overflow-x-hidden', onScroll:(container:any)=>scrollMenu(container,false) } : { options:{wheelPropagation:false,suppressScrollX:true}, onScrollY:(container:any)=>scrollMenu(container,true) })}>
      <Menu
        popoutMenuOffset={{ mainAxis:23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions,theme)}
        renderExpandIcon={({open})=><RenderExpandIcon open={open} transitionDuration={transitionDuration}/>}
        renderExpandedMenuItemIcon={{icon:<i className='tabler-circle text-xs'/>}}
        menuSectionStyles={menuSectionStyles(verticalNavOptions,theme)}
      >
        <MenuItem href={href('/dashboard')} icon={<i className='tabler-layout-dashboard'/>}>Dashboard</MenuItem>
        <MenuItem href={href('/search')} icon={<i className='tabler-search'/>}>Search</MenuItem>
        <MenuSection label='RESPONSE'>
          <MenuItem href={href('/incidents')} icon={<i className='tabler-siren'/>}>Incidents</MenuItem>
          <SubMenu label='EMS' icon={<i className='tabler-heart-rate-monitor'/>}>
            <MenuItem href={href('/ems')}>EMS Operations</MenuItem>
            <MenuItem href={href('/epcr')}>ePCR</MenuItem>
          </SubMenu>
          <MenuItem href={href('/neris')} icon={<i className='tabler-file-check'/>}>NERIS</MenuItem>
        </MenuSection>
        <MenuSection label='OPERATIONS'>
          <MenuItem href={href('/hydrants')} icon={<i className='tabler-droplet'/>}>Hydrants</MenuItem>
          <MenuItem href={href('/personnel')} icon={<i className='tabler-users'/>}>Personnel</MenuItem>
          <MenuItem href={href('/apparatus')} icon={<i className='tabler-truck'/>}>Apparatus</MenuItem>
          <MenuItem href={href('/training')} icon={<i className='tabler-school'/>}>Training</MenuItem>
          <MenuItem href={href('/inventory')} icon={<i className='tabler-box'/>}>Inventory</MenuItem>
        </MenuSection>
        <MenuSection label='PREVENTION'>
          <MenuItem href={href('/prevention')} icon={<i className='tabler-shield-check'/>}>Prevention</MenuItem>
          <MenuItem href={href('/occupancies')} icon={<i className='tabler-building'/>}>Occupancies</MenuItem>
          <MenuItem href={href('/preplans')} icon={<i className='tabler-map-2'/>}>Preplans</MenuItem>
          <MenuItem href={href('/inspections')} icon={<i className='tabler-clipboard-check'/>}>Inspections</MenuItem>
          <MenuItem href={href('/investigations')} icon={<i className='tabler-search'/>}>Investigations</MenuItem>
        </MenuSection>
        <MenuSection label='MANAGEMENT'>
          <MenuItem href={href('/scheduling/shift-trades')} icon={<i className='tabler-calendar-repeat'/>}>Shift Trades</MenuItem>
          <MenuItem href={href('/reports')} icon={<i className='tabler-chart-bar'/>}>Reports</MenuItem>
          <MenuItem href={href('/maps')} icon={<i className='tabler-map'/>}>Maps</MenuItem>
          <MenuItem href={href('/activity')} icon={<i className='tabler-activity'/>}>Activity</MenuItem>
          <MenuItem href={href('/settings')} icon={<i className='tabler-settings'/>}>Settings</MenuItem>
          <MenuItem href={href('/demo-control')} icon={<i className='tabler-presentation'/>}>Demo Control</MenuItem>
          <MenuItem href={href('/guided-demo')} icon={<i className='tabler-route'/>}>Guided Demo</MenuItem>
          <MenuItem href={href('/demo-readiness')} icon={<i className='tabler-checklist'/>}>Demo Readiness</MenuItem>
        </MenuSection>
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
