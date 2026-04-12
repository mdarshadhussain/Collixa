interface BadgeProps {
  children: React.ReactNode
  variant?: 'sage' | 'gray' | 'blue' | 'green' | 'red'
  className?: string
}

export default function Badge({
  children,
  variant = 'sage',
  className = '',
}: BadgeProps) {
  const variants = {
    sage: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
    gray: 'bg-[var(--color-border)] text-[var(--color-text-secondary)]',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
    red: 'bg-red-100 text-red-700',
  }

  return (
    <span
      className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
