import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../../utils/cn'

export interface SNTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Error state */
  error?: boolean
  /** Full width textarea */
  fullWidth?: boolean
  /** Number of visible rows */
  rows?: number
}

/**
 * ServiceNow-styled textarea
 *
 * @example
 * <SNTextarea
 *   placeholder="Enter description..."
 *   rows={4}
 *   value={value}
 *   onChange={handleChange}
 * />
 */
export const SNTextarea = forwardRef<HTMLTextAreaElement, SNTextareaProps>(
  ({ error, fullWidth, disabled, className, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 text-sm border rounded-sn bg-white resize-y transition-colors',
          'placeholder:text-sn-neutral-6',
          'hover:border-sn-neutral-5',
          'focus:border-sn-primary focus:ring-1 focus:ring-sn-primary focus:outline-none',
          'disabled:bg-sn-neutral-1 disabled:text-sn-neutral-6 disabled:cursor-not-allowed disabled:resize-none',
          error && 'border-sn-critical focus:border-sn-critical focus:ring-sn-critical',
          !error && 'border-sn-neutral-4',
          fullWidth && 'w-full',
          className
        )}
        {...props}
      />
    )
  }
)

SNTextarea.displayName = 'SNTextarea'
