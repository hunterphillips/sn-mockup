import { cn } from '../../../utils/cn'

export interface SNAvatarProps {
  /** User's name (used for fallback initials) */
  name?: string
  /** Image URL */
  src?: string
  /** Alt text for image */
  alt?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Additional CSS classes */
  className?: string
}

/**
 * ServiceNow-styled avatar component with image and initials fallback
 *
 * @example
 * <SNAvatar name="Hunter Phillips" src="/avatar.jpg" />
 * <SNAvatar name="John Doe" /> // Shows "JD" initials
 */
export function SNAvatar({ name, src, alt, size = 'md', className }: SNAvatarProps) {
  const sizeStyles = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-16 h-16 text-xl',
  }

  // Generate initials from name
  const initials = name
    ?.split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

  // Generate a consistent color based on name
  const colorIndex = name
    ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5
    : 0

  const bgColors = [
    'bg-sn-primary',
    'bg-sn-positive',
    'bg-sn-info',
    'bg-purple-600',
    'bg-sn-warning',
  ]

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={cn(
          'rounded-full object-cover ring-2 ring-white',
          sizeStyles[size],
          className
        )}
      />
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full text-white font-medium ring-2 ring-white',
        bgColors[colorIndex],
        sizeStyles[size],
        className
      )}
      title={name}
    >
      {initials}
    </span>
  )
}
