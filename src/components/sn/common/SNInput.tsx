import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../../utils/cn'
import { Search } from 'lucide-react'

export interface SNInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input size */
  size?: 'sm' | 'md' | 'lg'
  /** Icon to display at the start */
  icon?: ReactNode
  /** Icon to display at the end */
  iconAfter?: ReactNode
  /** Show lookup/search icon */
  lookup?: boolean
  /** Error state */
  error?: boolean
  /** Full width input */
  fullWidth?: boolean
}

/**
 * ServiceNow-styled text input
 *
 * @example
 * <SNInput placeholder="Search..." lookup />
 * <SNInput value={value} onChange={handleChange} />
 */
export const SNInput = forwardRef<HTMLInputElement, SNInputProps>(
  (
    {
      size = 'md',
      icon,
      iconAfter,
      lookup,
      error,
      fullWidth,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const hasIcon = icon || lookup
    const hasIconAfter = iconAfter

    const sizeStyles = {
      sm: 'h-7 text-xs',
      md: 'h-8 text-sm',
      lg: 'h-10 text-base',
    }

    const inputSizeStyles = {
      sm: hasIcon ? 'pl-7' : 'pl-2',
      md: hasIcon ? 'pl-8' : 'pl-3',
      lg: hasIcon ? 'pl-10' : 'pl-4',
    }

    const iconSizeStyles = {
      sm: 'left-2 w-3 h-3',
      md: 'left-2.5 w-4 h-4',
      lg: 'left-3 w-5 h-5',
    }

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {hasIcon && (
          <span className={cn('absolute top-1/2 -translate-y-1/2 text-sn-neutral-6 pointer-events-none', iconSizeStyles[size])}>
            {icon || <Search className="w-full h-full" />}
          </span>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full border rounded-sn bg-white transition-colors',
            'placeholder:text-sn-neutral-6',
            'hover:border-sn-neutral-5',
            'focus:border-sn-primary focus:ring-1 focus:ring-sn-primary focus:outline-none',
            'disabled:bg-sn-neutral-1 disabled:text-sn-neutral-6 disabled:cursor-not-allowed',
            error && 'border-sn-critical focus:border-sn-critical focus:ring-sn-critical',
            !error && 'border-sn-neutral-4',
            sizeStyles[size],
            inputSizeStyles[size],
            hasIconAfter ? 'pr-8' : 'pr-3',
            className
          )}
          {...props}
        />
        {hasIconAfter && (
          <span className={cn('absolute right-2 top-1/2 -translate-y-1/2 text-sn-neutral-6', iconSizeStyles[size])}>
            {iconAfter}
          </span>
        )}
      </div>
    )
  }
)

SNInput.displayName = 'SNInput'
