import { type ReactNode } from 'react'
import { cn } from '../../../utils/cn'

export interface SNBadgeProps {
  /** Badge content (typically a number or short text) */
  children: ReactNode
  /** Visual variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'critical' | 'info'
  /** Size variant */
  size?: 'sm' | 'md'
  /** Additional CSS classes */
  className?: string
}

/**
 * ServiceNow-styled badge/pill component
 *
 * @example
 * <SNBadge variant="primary">3</SNBadge>
 * <SNBadge variant="success">Active</SNBadge>
 */
export function SNBadge({ children, variant = 'default', size = 'md', className }: SNBadgeProps) {
  const variantStyles = {
    default: 'bg-sn-neutral-2 text-sn-neutral-8',
    primary: 'bg-sn-primary-light text-sn-primary',
    success: 'bg-sn-positive-light text-sn-positive',
    warning: 'bg-sn-warning-light text-sn-warning',
    critical: 'bg-sn-critical-light text-sn-critical',
    info: 'bg-sn-info-light text-sn-info',
  }

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-xs min-w-[18px]',
    md: 'px-2 py-0.5 text-xs min-w-[20px]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  )
}
