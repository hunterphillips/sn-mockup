import { Link } from 'react-router-dom'
import { cn } from '../../../utils/cn'
import { useTable } from '../../../context/DataContext'
import { Star, ChevronDown } from 'lucide-react'

export interface AppPillProps {
  /** Table name */
  table: string
  /** Record sys_id if viewing a specific record */
  recordId?: string | null
  /** Additional CSS classes */
  className?: string
}

/**
 * ServiceNow App Pill - shows current location in header
 *
 * @example
 * <AppPill table="incident" recordId="inc001" />
 */
export function AppPill({ table, recordId, className }: AppPillProps) {
  const tableDef = useTable(table)

  if (!tableDef) {
    return null
  }

  const label = recordId
    ? `${tableDef.label} - ${recordId.toUpperCase()}`
    : tableDef.labelPlural || tableDef.label

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full',
        'hover:bg-white/15 transition-colors cursor-pointer',
        className
      )}
    >
      <Link
        to={`/${table}/list`}
        className="text-white text-sm font-medium hover:underline"
      >
        {label}
      </Link>
      <button className="text-white/70 hover:text-white" aria-label="Add to favorites">
        <Star className="w-4 h-4" />
      </button>
      <button className="text-white/70 hover:text-white" aria-label="More options">
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  )
}
