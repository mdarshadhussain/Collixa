'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  children: ReactNode
  href?: string
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  href,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-bold uppercase tracking-[0.2em] rounded-2xl transition-all duration-500 flex items-center justify-center gap-2 transform active:scale-95'

  const variants = {
    primary: 'bg-[var(--color-accent)] text-[var(--color-inverse-text)] hover:bg-[var(--color-inverse-bg)] shadow-xl shadow-[var(--color-accent)]/10',
    secondary: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] shadow-sm',
    outline: 'border-2 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/20',
    ghost: 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/10',
  }

  const sizes = {
    sm: 'px-6 py-2.5 text-[10px]',
    md: 'px-10 py-4 text-[10px]',
    lg: 'px-14 py-6 text-[11px]',
  }

  const element = (
    <span
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {children}
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="inline-block" style={fullWidth ? { width: '100%' } : { width: 'auto' }}>
        {element}
      </Link>
    )
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
