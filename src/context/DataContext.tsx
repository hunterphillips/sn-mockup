import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { TableDefinition, SNRecord, UserProfile } from '../types';
import {
  initializeApi,
  getTableDefinitions,
  registerTableDefinition,
} from '../api/mockApi';

// Sample data: full TableDefinition with embedded data (tracked, ships with repo)
const sampleModules = import.meta.glob<{ default: TableDefinition }>(
  '../data/sample/*.json',
  { eager: true },
);

// Table definitions: may or may not have data property (user-imported)
const tableModules = import.meta.glob<{ default: TableDefinition }>(
  '../data/tables/*.json',
  { eager: true },
);

// Record data: plain arrays of SNRecord (separate from definitions)
const recordDataModules = import.meta.glob<{ default: SNRecord[] }>(
  '../data/recordData/*.json',
  { eager: true },
);

// Helper to extract table name from module path
function getTableNameFromPath(modulePath: string): string {
  const match = modulePath.match(/\/([^/]+)\.json$/);
  return match ? match[1] : '';
}

// Build map of record data by table name
const recordDataByTable = new Map<string, SNRecord[]>();
for (const [path, module] of Object.entries(recordDataModules)) {
  const tableName = getTableNameFromPath(path);
  if (tableName && Array.isArray(module.default)) {
    recordDataByTable.set(tableName, module.default);
  }
}

// Merge table definitions with record data
// Priority: tables/ overrides sample/, recordData/ supplements definitions without data
const appData = Array.from(
  new Map(
    [sampleModules, tableModules]
      .flatMap(Object.entries)
      .map(([, m]) => {
        const tableDef = m.default;
        const tableName = tableDef.name;

        // If definition has no data (or empty), check recordData
        if (!tableDef.data || tableDef.data.length === 0) {
          const records = recordDataByTable.get(tableName);
          if (records) {
            return [tableName, { ...tableDef, data: records }] as const;
          }
          // No records found, use empty array
          return [tableName, { ...tableDef, data: [] }] as const;
        }

        return [tableName, tableDef] as const;
      }),
  ).values(),
);

interface DataContextValue {
  tables: TableDefinition[];
  currentUser: UserProfile;
  isLoading: boolean;
  registerTable: (tableDef: TableDefinition) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

const defaultUser: UserProfile = {
  sys_id: 'user001',
  name: 'Hunter Phillips',
  email: 'hunter.phillips@example.com',
  title: 'System Administrator',
  company: 'ServiceNow',
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [tables, setTables] = useState<TableDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApi(appData);
    setTables(getTableDefinitions());
    setIsLoading(false);
  }, []);

  const registerTable = useCallback((tableDef: TableDefinition) => {
    registerTableDefinition(tableDef);
    setTables(getTableDefinitions());
  }, []);

  return (
    <DataContext.Provider
      value={{ tables, currentUser: defaultUser, isLoading, registerTable }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export function useTable(tableName: string): TableDefinition | undefined {
  const { tables } = useData();
  return tables.find((t) => t.name === tableName);
}
