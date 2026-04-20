interface BadgeProps {
  children: React.ReactNode
  variant?: 'sage' | 'gray' | 'blue' | 'green' | 'red' | 'accent' | 'outline'
  className?: string
}

export default function Badge({
  children,
  variant = 'sage',
  className = '',
}: BadgeProps) {
  const variants = {
    sage: 'bg-[var(--color-accent-soft)]/30 text-[var(--color-accent)]',
    accent: 'bg-[var(--color-accent)] text-white font-bold',
    gray: 'bg-[var(--color-border)] text-[var(--color-text-primary)] opacity-60',
    blue: 'bg-blue-50 text-[#021A54] border border-[#021A54]/10',
    green: 'bg-green-50 text-green-700 border border-green-200',
    red: 'bg-red-50 text-red-700 border border-red-200',
    outline: 'bg-transparent border border-[var(--color-border)]',
  }

  return (
    <span
      className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
