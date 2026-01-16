import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../../utils/cn'
import { SNInput } from '../common/SNInput'
import { SNCheckbox } from '../common/SNCheckbox'
import type { FieldDefinition, SNRecord } from '../../../types'
import { ChevronUp, ChevronDown, Search } from 'lucide-react'

export interface DataTableColumn {
  field: string
  label: string
  type: FieldDefinition['type']
  reference?: string // Target table name for reference fields
  sortable?: boolean
  width?: string
}

export interface DataTableProps {
  /** Table name for navigation */
  tableName: string
  /** Column definitions */
  columns: DataTableColumn[]
  /** Data rows */
  data: SNRecord[]
  /** Currently sorted column */
  sortField?: string
  /** Sort direction */
  sortDirection?: 'asc' | 'desc'
  /** Callback when sort changes */
  onSort?: (field: string) => void
  /** Column search values */
  columnFilters?: { [field: string]: string }
  /** Callback when column filter changes */
  onColumnFilter?: (field: string, value: string) => void
  /** Selected row sys_ids */
  selectedRows?: string[]
  /** Callback when selection changes */
  onSelectionChange?: (sysIds: string[]) => void
  /** Loading state */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * ServiceNow-styled data table with sorting and inline column search
 *
 * @example
 * <DataTable
 *   tableName="incident"
 *   columns={columns}
 *   data={records}
 *   sortField="number"
 *   sortDirection="asc"
 *   onSort={handleSort}
 * />
 */
export function DataTable({
  tableName,
  columns,
  data,
  sortField,
  sortDirection,
  onSort,
  columnFilters = {},
  onColumnFilter,
  selectedRows = [],
  onSelectionChange,
  loading,
  className,
}: DataTableProps) {
  const [showColumnFilters, setShowColumnFilters] = useState(true)

  const allSelected = data.length > 0 && selectedRows.length === data.length
  const someSelected = selectedRows.length > 0 && selectedRows.length < data.length

  const handleSelectAll = () => {
    if (onSelectionChange) {
      if (allSelected) {
        onSelectionChange([])
      } else {
        onSelectionChange(data.map(row => row.sys_id))
      }
    }
  }

  const handleSelectRow = (sysId: string) => {
    if (onSelectionChange) {
      if (selectedRows.includes(sysId)) {
        onSelectionChange(selectedRows.filter(id => id !== sysId))
      } else {
        onSelectionChange([...selectedRows, sysId])
      }
    }
  }

  const formatValue = (value: unknown, type: FieldDefinition['type']): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-sn-neutral-5">(empty)</span>
    }

    switch (type) {
      case 'datetime':
        return new Date(value as string).toLocaleString()
      case 'date':
        return new Date(value as string).toLocaleDateString()
      case 'boolean':
        return value ? 'Yes' : 'No'
      default:
        return String(value)
    }
  }

  return (
    <div className={cn('bg-white border border-sn-neutral-3 rounded-sn overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr className="bg-sn-neutral-1 border-b border-sn-neutral-3">
              {/* Checkbox column */}
              <th className="w-10 px-3 py-2">
                <SNCheckbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected
                  }}
                  onChange={handleSelectAll}
                  size="sm"
                />
              </th>
              {/* Search icon column */}
              <th className="w-8 px-2 py-2">
                <button
                  onClick={() => setShowColumnFilters(!showColumnFilters)}
                  className="text-sn-neutral-6 hover:text-sn-neutral-8"
                  aria-label="Toggle column filters"
                >
                  <Search className="w-4 h-4" />
                </button>
              </th>
              {/* Data columns */}
              {columns.map(col => (
                <th
                  key={col.field}
                  className={cn(
                    'px-3 py-2 text-left text-xs font-semibold text-sn-neutral-8 uppercase tracking-wide',
                    col.sortable !== false && 'cursor-pointer hover:bg-sn-neutral-2'
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && onSort?.(col.field)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortField === col.field && (
                      sortDirection === 'asc'
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
            {/* Column filter row */}
            {showColumnFilters && (
              <tr className="border-b border-sn-neutral-3">
                <th className="px-3 py-1" />
                <th className="px-2 py-1" />
                {columns.map(col => (
                  <th key={col.field} className="px-3 py-1">
                    <SNInput
                      size="sm"
                      placeholder="Search"
                      value={columnFilters[col.field] || ''}
                      onChange={(e) => onColumnFilter?.(col.field, e.target.value)}
                      className="w-full max-w-[150px]"
                    />
                  </th>
                ))}
              </tr>
            )}
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-3 py-8 text-center text-sn-neutral-6">
                  <div className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-5 w-5 border-2 border-sn-primary border-t-transparent rounded-full" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-3 py-8 text-center text-sn-neutral-6">
                  No records found
                </td>
              </tr>
            ) : (
              data.map(row => (
                <tr
                  key={row.sys_id}
                  className={cn(
                    'border-b border-sn-neutral-2 hover:bg-sn-neutral-1 transition-colors',
                    selectedRows.includes(row.sys_id) && 'bg-sn-primary-light'
                  )}
                >
                  <td className="px-3 py-2">
                    <SNCheckbox
                      checked={selectedRows.includes(row.sys_id)}
                      onChange={() => handleSelectRow(row.sys_id)}
                      size="sm"
                    />
                  </td>
                  <td className="px-2 py-2" />
                  {columns.map((col, colIndex) => (
                    <td key={col.field} className="px-3 py-2 text-sm">
                      {colIndex === 0 ? (
                        <Link
                          to={`/${tableName}/${row.sys_id}`}
                          className="text-sn-link hover:text-sn-link-hover hover:underline"
                        >
                          {formatValue(row[col.field], col.type)}
                        </Link>
                      ) : col.type === 'reference' && col.reference && row[col.field] ? (
                        <Link
                          to={`/${col.reference}/${row[col.field]}`}
                          className="text-sn-link hover:text-sn-link-hover hover:underline"
                        >
                          {formatValue(row[col.field], col.type)}
                        </Link>
                      ) : (
                        formatValue(row[col.field], col.type)
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
