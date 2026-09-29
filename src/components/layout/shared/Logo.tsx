'use client'

import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import styled from '@emotion/styled'
import type { VerticalNavContextProps } from '@menu/contexts/verticalNavContext'
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'
import PersistentDemoBranding from '@/components/forge-responder/PersistentDemoBranding'

type LogoTextProps = {
  isHovered?: VerticalNavContextProps['isHovered']
  isCollapsed?: VerticalNavContextProps['isCollapsed']
  transitionDuration?: VerticalNavContextProps['transitionDuration']
  isBreakpointReached?: VerticalNavContextProps['isBreakpointReached']
  color?: CSSProperties['color']
}

const LogoText = styled.span<LogoTextProps>`
  color: ${({ color }) => color ?? 'var(--mui-palette-text-primary)'};
  font-size: 1.05rem;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: .02em;
  transition: ${({ transitionDuration }) => `margin-inline-start ${transitionDuration}ms ease-in-out, opacity ${transitionDuration}ms ease-in-out`};
  ${({ isHovered, isCollapsed, isBreakpointReached }) =>
    !isBreakpointReached && isCollapsed && !isHovered
      ? 'opacity: 0; margin-inline-start: 0;'
      : 'opacity: 1; margin-inline-start: 10px;'}
`


const Logo = ({ color }: { color?: CSSProperties['color'] }) => {
  const logoTextRef = useRef<HTMLSpanElement>(null)
  const { isHovered, transitionDuration, isBreakpointReached } = useVerticalNav()
  const { settings } = useSettings()
  const { layout } = settings

  useEffect(() => {
    if (layout !== 'collapsed') return
    if (!logoTextRef.current) return
    if (!isBreakpointReached && layout === 'collapsed' && !isHovered) logoTextRef.current.classList.add('hidden')
    else logoTextRef.current.classList.remove('hidden')
  }, [isHovered, layout, isBreakpointReached])

  return (
    <div className='flex items-center'>
      <PersistentDemoBranding slot='primaryLogo' maxHeight={38} maxWidth={48} fallback='mark' />
      <LogoText
        color={color}
        ref={logoTextRef}
        isHovered={isHovered}
        isCollapsed={layout === 'collapsed'}
        transitionDuration={transitionDuration}
        isBreakpointReached={isBreakpointReached}
      >
        FORGE <span style={{ color: 'var(--mui-palette-error-main)' }}>RESPONDER</span>
      </LogoText>
    </div>
  )
}

export default Logo
