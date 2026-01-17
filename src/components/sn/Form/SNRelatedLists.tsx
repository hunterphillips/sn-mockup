import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../../context/DataContext'
import { getRelatedRecords } from '../../../api/mockApi'
import { getDisplayValue } from '../../../utils/fieldValue'
import { SNTabs } from '../common'
import type { SNRecord, RelatedListDefinition, TableDefinition, FieldDefinition } from '../../../types'

/** Data for a single related list */
interface RelatedListData {
  definition: RelatedListDefinition
  records: SNRecord[]
  loading: boolean
  relatedTableDef?: TableDefinition
}

export interface SNRelatedListsProps {
  /** Related list definitions from table config */
  relatedLists: RelatedListDefinition[]
  /** sys_id of the parent record */
  parentSysId: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Displays related lists as tabs with record tables
 */
export function SNRelatedLists({
  relatedLists,
  parentSysId,
  className,
}: SNRelatedListsProps) {
  const { tables } = useData()
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [listsData, setListsData] = useState<RelatedListData[]>([])

  const fetchRelatedLists = useCallback(async () => {
    // Initialize with loading state
    const initialData: RelatedListData[] = relatedLists.map((def) => ({
      definition: def,
      records: [],
      loading: true,
      relatedTableDef: tables.find((t) => t.name === def.table),
    }))
    setListsData(initialData)

    // Set default active tab
    if (!activeTab && relatedLists.length > 0) {
      setActiveTab(relatedLists[0].table)
    }

    // Fetch records for each related list
    for (const def of relatedLists) {
      try {
        const response = await getRelatedRecords(def.table, def.parentField, parentSysId)
        setListsData((prev) =>
          prev.map((item) =>
            item.definition.table === def.table
              ? { ...item, records: response.data, loading: false }
              : item
          )
        )
      } catch (error) {
        console.error(`Failed to fetch related records for ${def.table}:`, error)
        setListsData((prev) =>
          prev.map((item) =>
            item.definition.table === def.table
              ? { ...item, loading: false }
              : item
          )
        )
      }
    }
  }, [relatedLists, tables, parentSysId, activeTab])

  useEffect(() => {
    fetchRelatedLists()
  }, [fetchRelatedLists])

  const formatValue = (value: unknown, field?: FieldDefinition): string => {
    const displayVal = getDisplayValue(value)
    if (!displayVal) {
      return ''
    }
    if (field?.type === 'datetime') {
      return new Date(displayVal).toLocaleString()
    }
    if (field?.type === 'date') {
      return new Date(displayVal).toLocaleDateString()
    }
    if (field?.type === 'boolean') {
      return displayVal === 'true' || displayVal === '1' ? 'Yes' : 'No'
    }
    return displayVal
  }

  if (listsData.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <SNTabs
        tabs={listsData.map((rl) => ({
          id: rl.definition.table,
          label: rl.definition.title,
          count: rl.loading ? undefined : rl.records.length,
        }))}
        activeTab={activeTab || undefined}
        onTabChange={setActiveTab}
      />

      {listsData.map((rl) => {
        if (rl.definition.table !== activeTab) return null

        const columns = rl.definition.columns || rl.relatedTableDef?.list.columns || []
        const fields = rl.relatedTableDef?.fields || []

        return (
          <div
            key={rl.definition.table}
            className="bg-white border border-t-0 border-sn-neutral-3 rounded-b-sn"
          >
            {rl.loading ? (
              <div className="flex items-center justify-center py-8">
                <span className="animate-spin h-5 w-5 border-2 border-sn-primary border-t-transparent rounded-full" />
                <span className="ml-2 text-sm text-sn-neutral-6">Loading...</span>
              </div>
            ) : rl.records.length === 0 ? (
              <div className="py-8 text-center text-sm text-sn-neutral-6">
                No records found
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sn-neutral-3 bg-sn-neutral-1">
                    {columns.map((colName) => {
                      const field = fields.find((f) => f.name === colName)
                      return (
                        <th
                          key={colName}
                          className="px-3 py-2 text-left text-xs font-semibold text-sn-neutral-8 uppercase tracking-wide"
                        >
                          {field?.label || colName}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rl.records.map((rec) => (
                    <tr
                      key={rec.sys_id}
                      className="border-b border-sn-neutral-2 hover:bg-sn-neutral-1"
                    >
                      {columns.map((colName, colIndex) => {
                        const field = fields.find((f) => f.name === colName)
                        const displayValue = formatValue(rec[colName], field)

                        return (
                          <td key={colName} className="px-3 py-2 text-sm">
                            {colIndex === 0 ? (
                              <Link
                                to={`/${rl.definition.table}/${rec.sys_id}`}
                                className="text-sn-link hover:text-sn-link-hover hover:underline"
                              >
                                {displayValue || rec.sys_id}
                              </Link>
                            ) : (
                              displayValue
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      })}
    </div>
  )
}
