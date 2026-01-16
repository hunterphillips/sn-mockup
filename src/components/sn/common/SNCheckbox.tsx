import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../../utils/cn'
import { Check } from 'lucide-react'

export interface SNCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Checkbox label */
  label?: string
  /** Size variant */
  size?: 'sm' | 'md'
}

/**
 * ServiceNow-styled checkbox
 *
 * @example
 * <SNCheckbox label="Active" checked={active} onChange={handleChange} />
 */
export const SNCheckbox = forwardRef<HTMLInputElement, SNCheckboxProps>(
  ({ label, size = 'md', disabled, className, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`

    const sizeStyles = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
    }

    const iconSizeStyles = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
    }

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          'inline-flex items-center gap-2 cursor-pointer',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <span className="relative">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <span
            className={cn(
              'block border rounded transition-colors',
              'border-sn-neutral-4 bg-white',
              'peer-hover:border-sn-neutral-5',
              'peer-focus:ring-2 peer-focus:ring-sn-primary peer-focus:ring-offset-1',
              'peer-checked:bg-sn-primary peer-checked:border-sn-primary',
              'peer-disabled:bg-sn-neutral-1',
              sizeStyles[size]
            )}
          />
          <Check
            className={cn(
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none',
              iconSizeStyles[size]
            )}
            strokeWidth={3}
          />
        </span>
        {label && <span className="text-sm text-sn-neutral-9">{label}</span>}
      </label>
    )
  }
)

SNCheckbox.displayName = 'SNCheckbox'
