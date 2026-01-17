import { useState, useEffect, useCallback } from 'react'
import { cn } from '../../../utils/cn'
import { useTable } from '../../../context/DataContext'
import { getRecords } from '../../../api/mockApi'
import { ListToolbar } from './ListToolbar'
import { FilterBuilder } from './FilterBuilder'
import { DataTable, type DataTableColumn } from './DataTable'
import { Pagination } from './Pagination'
import type { SNRecord, FilterCondition, QueryParams } from '../../../types'

export interface SNListProps {
  /** Table name */
  tableName: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Complete ServiceNow list view component
 *
 * @example
 * <SNList tableName="incident" />
 */
export function SNList({ tableName, className }: SNListProps) {
  const tableDef = useTable(tableName)

  // State
  const [data, setData] = useState<SNRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<string | undefined>(tableDef?.list.defaultSort?.field)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(tableDef?.list.defaultSort?.direction || 'asc')
  const [filterVisible, setFilterVisible] = useState(false)
  const [conditions, setConditions] = useState<FilterCondition[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [columnFilters, setColumnFilters] = useState<{ [field: string]: string }>({})
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  const pageSize = tableDef?.list.pageSize || 20

  // Build columns from table definition
  const columns: DataTableColumn[] = tableDef?.list.columns.map(fieldName => {
    const field = tableDef.fields.find(f => f.name === fieldName)
    return {
      field: fieldName,
      label: field?.label || fieldName,
      type: field?.type || 'string',
      reference: field?.reference,
      sortable: true,
    }
  }) || []

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!tableDef) return

    setLoading(true)
    try {
      const query: QueryParams = {
        page,
        pageSize,
        sortField,
        sortDirection,
        filters: conditions.length > 0 ? conditions : undefined,
        search: searchValue || undefined,
      }

      const result = await getRecords(tableName, query)
      setData(result.data)
      setTotal(result.total)
    } catch (error) {
      console.error('Failed to fetch records:', error)
    } finally {
      setLoading(false)
    }
  }, [tableName, tableDef, page, pageSize, sortField, sortDirection, conditions, searchValue])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [conditions, searchValue])

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Handle column filter
  const handleColumnFilter = (field: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [field]: value }))
    // TODO: Integrate column filters with query
  }

  if (!tableDef) {
    return (
      <div className="p-8 text-center text-sn-neutral-6">
        Table "{tableName}" not found
      </div>
    )
  }

  // Build filter breadcrumb from actual conditions
  const filterBreadcrumb = conditions.length > 0
    ? `All > ${conditions.map(c => `${c.field} ${c.operator} "${c.value}"`).join(` ${conditions[1]?.conjunction || 'AND'} `)}`
    : 'All'

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <ListToolbar
        tableName={tableName}
        tableLabel={tableDef.labelPlural || tableDef.label}
        filterBreadcrumb={filterBreadcrumb}
        filterVisible={filterVisible}
        onToggleFilter={() => setFilterVisible(!filterVisible)}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        selectedCount={selectedRows.length}
      />

      {filterVisible && (
        <FilterBuilder
          fields={tableDef.fields}
          conditions={conditions}
          onConditionsChange={setConditions}
          onRun={fetchData}
        />
      )}

      <div className="flex-1 overflow-auto p-4">
        <DataTable
          tableName={tableName}
          columns={columns}
          data={data}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          columnFilters={columnFilters}
          onColumnFilter={handleColumnFilter}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          loading={loading}
        />

        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
