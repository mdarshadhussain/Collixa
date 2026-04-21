'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
// Use any for props if library type resolution is problematic to ensure build succeeds
type ThemeProviderProps = any
import { usePathname } from 'next/navigation'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const pathname = usePathname()
  const isExcluded = pathname === '/' || pathname?.startsWith('/auth')
  const modifiedProps = isExcluded ? { ...props, forcedTheme: 'light' } : props
  
  return <NextThemesProvider {...modifiedProps}>{children}</NextThemesProvider>
}
