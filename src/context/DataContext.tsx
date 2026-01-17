import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { TableDefinition, UserProfile } from '../types'
import { initializeApi, getTableDefinitions, registerTableDefinition } from '../api/mockApi'

// Import table definitions
import incidentTable from '../data/tables/incident.json'
import sysUserTable from '../data/tables/sys_user.json'
import sysUserGroupTable from '../data/tables/sys_user_group.json'
import storyTable from '../data/tables/rm_story.json'

interface DataContextValue {
  tables: TableDefinition[]
  currentUser: UserProfile
  isLoading: boolean
  registerTable: (tableDef: TableDefinition) => void
}

const DataContext = createContext<DataContextValue | null>(null)

const defaultUser: UserProfile = {
  sys_id: 'user001',
  name: 'Hunter Phillips',
  email: 'hunter.phillips@example.com',
  title: 'System Administrator',
  company: 'ServiceNow',
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [tables, setTables] = useState<TableDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize the mock API with table definitions
    const tableDefs = [incidentTable, sysUserTable, sysUserGroupTable, storyTable] as TableDefinition[]
    initializeApi(tableDefs)
    setTables(getTableDefinitions())
    setIsLoading(false)
  }, [])

  const registerTable = useCallback((tableDef: TableDefinition) => {
    registerTableDefinition(tableDef)
    setTables(getTableDefinitions())
  }, [])

  return (
    <DataContext.Provider value={{ tables, currentUser: defaultUser, isLoading, registerTable }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export function useTable(tableName: string): TableDefinition | undefined {
  const { tables } = useData()
  return tables.find(t => t.name === tableName)
}
