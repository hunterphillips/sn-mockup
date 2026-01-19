import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { TableDefinition, UserProfile } from '../types';
import {
  initializeApi,
  getTableDefinitions,
  registerTableDefinition,
} from '../api/mockApi';

// include sample Incident data. Will be overwritten by user-imported data if present.
const sampleModules = import.meta.glob<{ default: TableDefinition }>(
  '../data/sample/*.json',
  { eager: true },
);
const tableModules = import.meta.glob<{ default: TableDefinition }>(
  '../data/tables/*.json',
  { eager: true },
);

const appData = Array.from(
  new Map(
    [sampleModules, tableModules]
      .flatMap(Object.values)
      .map((m) => [m.default.name, m.default] as const),
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
