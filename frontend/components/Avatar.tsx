import { useState, useMemo } from 'react'

interface AvatarProps {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

const AVATAR_PRESETS = [
  'Abby', 'Angel', 'Bailey', 'Caleb', 'Daisy', 
  'Ethan', 'Faith', 'Gabe', 'Hazel', 'Issac'
].map(seed => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`)

export default function Avatar({
  name,
  src,
  size = 'md',
  className = '',
  onClick,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false)

  const sizes = {
    xs: 'w-6 h-6 text-[8px]',
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm',
    xl: 'w-20 h-20 text-lg',
  }

  // Deterministic fallback preset based on name
  const fallbackPreset = useMemo(() => {
    if (!name) return AVATAR_PRESETS[0]
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % AVATAR_PRESETS.length
    return AVATAR_PRESETS[index]
  }, [name])

  // Resolve the final source - use provided src unless it failed, otherwise use deterministic fallback
  const finalSrc = src && !imgError ? src : fallbackPreset

  return (
    <div 
      className={`relative rounded-full overflow-hidden border border-[var(--color-border)] shrink-0 aspect-square ${sizes[size]} ${className}`}
      onClick={onClick}
    >
      <img
        src={finalSrc}
        alt={name}
        onError={() => setImgError(true)}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </div>
  )
}
