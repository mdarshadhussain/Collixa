interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverEffect?: boolean
}

export default function Card({
  children,
  className = '',
  onClick,
  hoverEffect = false,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--color-bg-secondary)] rounded-[2rem] p-8 border border-[var(--color-border)] shadow-xl shadow-[var(--color-accent)]/5 transition-all duration-700 ${
        hoverEffect ? 'hover:shadow-2xl hover:shadow-[var(--color-accent)]/10 hover:border-[var(--color-accent-soft)] hover:translate-y-[-4px] cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
