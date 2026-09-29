'use client'

import classnames from 'classnames'
import NavToggle from './NavToggle'
import NavSearch from '@components/layout/shared/search'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import ShortcutsDropdown from '@components/layout/shared/ShortcutsDropdown'
import NotificationsDropdown from '@components/layout/shared/NotificationsDropdown'
import type { ShortcutsType } from '@components/layout/shared/ShortcutsDropdown'
import type { NotificationsType } from '@components/layout/shared/NotificationsDropdown'
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const shortcuts: ShortcutsType[] = [
  { url: '/dashboard', icon: 'tabler-layout-dashboard', title: 'Dashboard', subtitle: 'Command overview' },
  { url: '/hydrants', icon: 'tabler-droplet', title: 'Hydrants', subtitle: 'Water supply' },
  { url: '/personnel', icon: 'tabler-users', title: 'Personnel', subtitle: 'Roster & credentials' },
  { url: '/apparatus', icon: 'tabler-truck', title: 'Apparatus', subtitle: 'Fleet readiness' },
  { url: '/demo-control', icon: 'tabler-presentation', title: 'Demo Control', subtitle: 'Presenter launchpad' },
  { url: '/guided-demo', icon: 'tabler-route', title: 'Guided Demo', subtitle: 'Trade-show sequence' },
  { url: '/demo-readiness', icon: 'tabler-checklist', title: 'Demo Readiness', subtitle: 'Pre-show checks' }
]

const notifications: NotificationsType[] = [
  { avatarIcon: 'tabler-droplet-off', avatarColor: 'error', title: 'Hydrant readiness', subtitle: 'Out-of-service hydrants require review', time: 'Demo', read: false },
  { avatarIcon: 'tabler-truck', avatarColor: 'warning', title: 'Fleet readiness', subtitle: 'Review apparatus maintenance status', time: 'Demo', read: false },
  { avatarIcon: 'tabler-shield-check', avatarColor: 'success', title: 'Trade-show environment', subtitle: 'Sanitized source data loaded locally', time: 'Now', read: true }
]

const NavbarContent = () => (
  <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
    <div className='flex items-center gap-4'>
      <NavToggle />
      <NavSearch />
    </div>
    <div className='flex items-center gap-1'>
      <span className='hidden sm:inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full border border-solid border-[var(--mui-palette-divider)]'>
        <i className='tabler-flame text-error' /> Trade Show Demo
      </span>
      <ModeDropdown />
      <ShortcutsDropdown shortcuts={shortcuts} />
      <NotificationsDropdown notifications={notifications} />
    </div>
  </div>
)

export default NavbarContent
