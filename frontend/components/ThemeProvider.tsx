'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'
import { usePathname } from 'next/navigation'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const pathname = usePathname()
  const isExcluded = pathname === '/' || pathname?.startsWith('/auth')
  const modifiedProps = isExcluded ? { ...props, forcedTheme: 'light' } : props
  
  return <NextThemesProvider {...modifiedProps}>{children}</NextThemesProvider>
}
