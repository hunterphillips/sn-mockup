import { useEffect, type ReactNode } from 'react'
import { cn } from '../../../utils/cn'
import { X } from 'lucide-react'
import { SNButton } from './SNButton'

export interface SNModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Modal title */
  title?: string
  /** Modal content */
  children: ReactNode
  /** Footer content (typically action buttons) */
  footer?: ReactNode
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Whether clicking backdrop closes modal */
  closeOnBackdropClick?: boolean
  /** Additional CSS classes for modal content */
  className?: string
}

/**
 * ServiceNow-styled modal dialog
 *
 * @example
 * <SNModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Delete"
 *   footer={
 *     <>
 *       <SNButton variant="secondary" onClick={() => setIsOpen(false)}>Cancel</SNButton>
 *       <SNButton variant="primary" onClick={handleDelete}>Delete</SNButton>
 *     </>
 *   }
 * >
 *   Are you sure you want to delete this record?
 * </SNModal>
 */
export function SNModal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdropClick = true,
  className,
}: SNModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-[90vw] max-h-[90vh]',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative w-full bg-white rounded-sn-lg shadow-sn-5 animate-in zoom-in-95 fade-in duration-200',
          sizeStyles[size],
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-sn-neutral-3">
            <h2 id="modal-title" className="text-lg font-semibold text-sn-neutral-9">
              {title}
            </h2>
            <SNButton variant="bare" size="sm" onClick={onClose} aria-label="Close">
              <X className="w-5 h-5" />
            </SNButton>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-sn-neutral-3 bg-sn-neutral-1 rounded-b-sn-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
