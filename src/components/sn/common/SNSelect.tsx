import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '../../../utils/cn'
import { ChevronDown } from 'lucide-react'

export interface SNSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SNSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Select size */
  size?: 'sm' | 'md' | 'lg'
  /** Options to display */
  options?: SNSelectOption[]
  /** Placeholder option */
  placeholder?: string
  /** Error state */
  error?: boolean
  /** Full width select */
  fullWidth?: boolean
}

/**
 * ServiceNow-styled select dropdown
 *
 * @example
 * <SNSelect
 *   options={[
 *     { value: 'new', label: 'New' },
 *     { value: 'active', label: 'Active' },
 *   ]}
 *   placeholder="Select state..."
 * />
 */
export const SNSelect = forwardRef<HTMLSelectElement, SNSelectProps>(
  (
    {
      size = 'md',
      options = [],
      placeholder,
      error,
      fullWidth,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      sm: 'h-7 text-xs pl-2 pr-7',
      md: 'h-8 text-sm pl-3 pr-8',
      lg: 'h-10 text-base pl-4 pr-10',
    }

    const iconSizeStyles = {
      sm: 'right-1.5 w-3 h-3',
      md: 'right-2 w-4 h-4',
      lg: 'right-2.5 w-5 h-5',
    }

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full appearance-none border rounded-sn bg-white cursor-pointer transition-colors',
            'hover:border-sn-neutral-5',
            'focus:border-sn-primary focus:ring-1 focus:ring-sn-primary focus:outline-none',
            'disabled:bg-sn-neutral-1 disabled:text-sn-neutral-6 disabled:cursor-not-allowed',
            error && 'border-sn-critical focus:border-sn-critical focus:ring-sn-critical',
            !error && 'border-sn-neutral-4',
            sizeStyles[size],
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        <ChevronDown
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-sn-neutral-6 pointer-events-none',
            iconSizeStyles[size]
          )}
        />
      </div>
    )
  }
)

SNSelect.displayName = 'SNSelect'
