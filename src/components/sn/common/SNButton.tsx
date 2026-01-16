import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../../utils/cn'

export interface SNButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button visual variant */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'bare'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Icon to display before the label */
  icon?: ReactNode
  /** Icon to display after the label */
  iconAfter?: ReactNode
  /** Whether the button is in a loading state */
  loading?: boolean
  /** Full width button */
  fullWidth?: boolean
}

/**
 * ServiceNow-styled button component
 *
 * @example
 * <SNButton variant="primary">Save</SNButton>
 * <SNButton variant="secondary" icon={<Plus />}>New</SNButton>
 */
export const SNButton = forwardRef<HTMLButtonElement, SNButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      icon,
      iconAfter,
      loading,
      fullWidth,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-sn transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sn-primary disabled:opacity-50 disabled:cursor-not-allowed'

    const variantStyles = {
      primary: 'bg-sn-primary text-white hover:bg-sn-primary-hover active:bg-sn-primary-hover',
      secondary: 'bg-white text-sn-neutral-9 border border-sn-neutral-4 hover:bg-sn-neutral-1 hover:border-sn-neutral-5 active:bg-sn-neutral-2',
      tertiary: 'bg-transparent text-sn-link hover:bg-sn-primary-light active:bg-sn-primary-light',
      bare: 'bg-transparent text-sn-neutral-7 hover:text-sn-neutral-9 hover:bg-sn-neutral-1',
    }

    const sizeStyles = {
      sm: 'h-7 px-3 text-xs gap-1',
      md: 'h-8 px-4 text-sm gap-1.5',
      lg: 'h-10 px-5 text-base gap-2',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        ) : (
          icon
        )}
        {children && <span>{children}</span>}
        {iconAfter}
      </button>
    )
  }
)

SNButton.displayName = 'SNButton'
