import { cn } from '../../../utils/cn'
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react'

export interface PaginationProps {
  /** Current page (1-indexed) */
  page: number
  /** Number of items per page */
  pageSize: number
  /** Total number of items */
  total: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * ServiceNow-styled pagination component
 *
 * @example
 * <Pagination
 *   page={1}
 *   pageSize={20}
 *   total={100}
 *   onPageChange={setPage}
 * />
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const canGoPrevious = page > 1
  const canGoNext = page < totalPages

  const buttonStyles = cn(
    'p-1.5 rounded transition-colors',
    'hover:bg-sn-neutral-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent'
  )

  return (
    <div className={cn('flex items-center justify-center gap-2 py-3', className)}>
      <button
        onClick={() => onPageChange(1)}
        disabled={!canGoPrevious}
        className={buttonStyles}
        aria-label="First page"
      >
        <ChevronsLeft className="w-4 h-4 text-sn-neutral-7" />
      </button>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!canGoPrevious}
        className={buttonStyles}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4 text-sn-neutral-7" />
      </button>

      <div className="flex items-center gap-2 px-2">
        <input
          type="number"
          min={1}
          max={totalPages}
          value={page}
          onChange={(e) => {
            const newPage = parseInt(e.target.value, 10)
            if (newPage >= 1 && newPage <= totalPages) {
              onPageChange(newPage)
            }
          }}
          className="w-12 h-7 px-2 text-center text-sm border border-sn-neutral-3 rounded-sn focus:outline-none focus:border-sn-primary"
        />
        <span className="text-sm text-sn-neutral-7">
          {start} to {end} of {total}
        </span>
      </div>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!canGoNext}
        className={buttonStyles}
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4 text-sn-neutral-7" />
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={!canGoNext}
        className={buttonStyles}
        aria-label="Last page"
      >
        <ChevronsRight className="w-4 h-4 text-sn-neutral-7" />
      </button>
    </div>
  )
}
