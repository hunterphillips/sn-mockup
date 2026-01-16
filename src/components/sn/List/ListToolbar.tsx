import { Link } from 'react-router-dom'
import { cn } from '../../../utils/cn'
import { SNButton } from '../common/SNButton'
import { SNInput } from '../common/SNInput'
import { SNSelect } from '../common/SNSelect'
import {
  Menu,
  Filter,
  Settings,
  Download,
  Minus,
  Plus,
} from 'lucide-react'

export interface ListToolbarProps {
  /** Table name for "New" button navigation */
  tableName: string
  /** Table label */
  tableLabel: string
  /** Current filter breadcrumb */
  filterBreadcrumb?: string
  /** Callback to toggle filter panel */
  onToggleFilter?: () => void
  /** Whether filter panel is visible */
  filterVisible?: boolean
  /** Global search value */
  searchValue?: string
  /** Callback when search changes */
  onSearchChange?: (value: string) => void
  /** Number of selected rows */
  selectedCount?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * ServiceNow list toolbar with filter toggle, search, and actions
 *
 * @example
 * <ListToolbar
 *   tableName="incident"
 *   tableLabel="Incidents"
 *   onToggleFilter={() => setFilterVisible(!filterVisible)}
 *   filterVisible={filterVisible}
 * />
 */
export function ListToolbar({
  tableName,
  tableLabel,
  filterBreadcrumb,
  onToggleFilter,
  filterVisible,
  searchValue,
  onSearchChange,
  selectedCount = 0,
  className,
}: ListToolbarProps) {
  return (
    <div className={cn('bg-white border-b border-sn-neutral-3 px-4 py-2', className)}>
      {/* Top row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-sn-neutral-1 rounded transition-colors">
            <Menu className="w-4 h-4 text-sn-neutral-7" />
          </button>
          <button
            onClick={onToggleFilter}
            className={cn(
              'p-1.5 rounded transition-colors',
              filterVisible ? 'bg-sn-primary-light text-sn-primary' : 'hover:bg-sn-neutral-1 text-sn-neutral-7'
            )}
            aria-label="Toggle filter"
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Table name and search */}
          <div className="flex items-center gap-2 border-l border-sn-neutral-3 pl-3 ml-1">
            <span className="text-sm font-medium text-sn-neutral-8">{tableLabel}</span>
            <SNSelect
              size="sm"
              options={[{ value: 'number', label: 'Number' }]}
              value="number"
              onChange={() => {}}
              className="w-24"
            />
            <SNInput
              size="sm"
              placeholder="Search"
              lookup
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-sn-neutral-1 rounded transition-colors text-sn-neutral-7">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-sn-neutral-1 rounded transition-colors text-sn-neutral-7">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-sn-neutral-1 rounded transition-colors text-sn-neutral-7">
            <Minus className="w-4 h-4" />
          </button>

          <SNSelect
            size="sm"
            options={[{ value: 'actions', label: 'Actions on selected rows...' }]}
            value="actions"
            onChange={() => {}}
            disabled={selectedCount === 0}
            className="w-52"
          />

          <Link to={`/${tableName}/new`}>
            <SNButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              New
            </SNButton>
          </Link>
        </div>
      </div>

      {/* Filter breadcrumb */}
      {filterBreadcrumb && (
        <div className="mt-2 text-xs text-sn-neutral-7">
          {filterBreadcrumb}
        </div>
      )}
    </div>
  )
}
