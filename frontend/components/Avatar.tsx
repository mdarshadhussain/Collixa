interface AvatarProps {
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function Avatar({
  name,
  src,
  size = 'md',
  className = '',
}: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm',
    xl: 'w-20 h-20 text-lg',
  }

  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover border border-[var(--color-border)] ${sizes[size]} ${className}`}
      />
    )
  }

  return (
    <div
      className={`rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center font-black uppercase tracking-tighter ${sizes[size]} ${className}`}
    >
      {initials}
    </div>
  )
}
