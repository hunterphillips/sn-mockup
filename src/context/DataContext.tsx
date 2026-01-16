import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { TableDefinition, UserProfile } from '../types'
import { initializeApi, getTableDefinitions } from '../api/mockApi'

// Import table definitions
import incidentTable from '../data/tables/incident.json'
import sysUserTable from '../data/tables/sys_user.json'
import storyTable from '../data/tables/rm_story.json'

interface DataContextValue {
  tables: TableDefinition[]
  currentUser: UserProfile
  isLoading: boolean
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
    const tableDefs = [incidentTable, sysUserTable, storyTable] as TableDefinition[]
    initializeApi(tableDefs)
    setTables(getTableDefinitions())
    setIsLoading(false)
  }, [])

  return (
    <DataContext.Provider value={{ tables, currentUser: defaultUser, isLoading }}>
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
