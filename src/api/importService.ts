import type { TableDefinition } from '../types'

export interface ImportResult {
  success: boolean
  tableName?: string
  fieldCount?: number
  recordCount?: number
  tableDef?: TableDefinition
  error?: string
}

/**
 * Import a table definition from a ServiceNow instance.
 * Calls the dev server endpoint which proxies to ServiceNow to avoid CORS.
 */
export async function importTable(tableName: string): Promise<ImportResult> {
  try {
    const response = await fetch('/api/sn/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Import failed with status ${response.status}`,
      }
    }

    return {
      success: true,
      tableName: data.tableName,
      fieldCount: data.fieldCount,
      recordCount: data.recordCount,
      tableDef: data.tableDef as TableDefinition,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
