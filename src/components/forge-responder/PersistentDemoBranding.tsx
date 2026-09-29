'use client'

import { useCallback, useEffect, useState } from 'react'
import Box from '@mui/material/Box'

type BrandingConfig = {
  primaryLogo: string | null
  secondaryLogo: string | null
  updatedAt: string | null
}

type Props = {
  slot?: 'primaryLogo' | 'secondaryLogo'
  maxHeight?: number
  maxWidth?: number
  fallback?: 'mark' | 'none'
}

export default function PersistentDemoBranding({
  slot = 'primaryLogo',
  maxHeight = 42,
  maxWidth = 80,
  fallback = 'none'
}: Props) {
  const [branding, setBranding] = useState<BrandingConfig | null>(null)

  const load = useCallback(() => {
    fetch('/api/demo-branding', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(setBranding)
      .catch(() => setBranding({ primaryLogo: null, secondaryLogo: null, updatedAt: null }))
  }, [])

  useEffect(() => {
    load()

    window.addEventListener('forge-demo-branding-changed', load)

    return () => window.removeEventListener('forge-demo-branding-changed', load)
  }, [load])

  const src = branding?.[slot]

  if (!src) {
    if (fallback === 'mark') {
      return (
        <Box
          component='span'
          sx={{
            inlineSize: 34,
            blockSize: 34,
            borderRadius: '9px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'error.main',
            color: 'common.white',
            fontWeight: 900,
            letterSpacing: '-.06em',
            flex: '0 0 auto'
          }}
        >
          FR
        </Box>
      )
    }

    return null
  }

  return (
    <Box
      component='img'
      src={`${src}&v=${encodeURIComponent(branding?.updatedAt || '')}`}
      alt={slot === 'primaryLogo' ? 'Demo agency logo' : 'Demo secondary logo'}
      sx={{
        maxHeight,
        maxWidth,
        objectFit: 'contain',
        display: 'block',
        flex: '0 0 auto'
      }}
    />
  )
}
