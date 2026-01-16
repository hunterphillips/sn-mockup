import type {
  TableDefinition,
  SNRecord,
  QueryParams,
  ListResponse,
  FilterCondition,
} from '../types';

// In-memory data store
const tables: Map<string, TableDefinition> = new Map();
const data: Map<string, SNRecord[]> = new Map();

/** Persist table data to JSON file via dev server API */
async function persistToServer(tableName: string): Promise<void> {
  const tableData = data.get(tableName);
  if (!tableData) return;

  try {
    const response = await fetch(`/api/tables/${tableName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: tableData }),
    });

    if (!response.ok) {
      console.warn(`Failed to persist ${tableName} to server:`, await response.text());
    }
  } catch (error) {
    // Silent fail in production or if server not available
    console.warn(`Could not persist ${tableName}:`, error);
  }
}

/** Initialize the mock API with table definitions */
export function initializeApi(tableDefs: TableDefinition[]): void {
  for (const table of tableDefs) {
    tables.set(table.name, table);
    data.set(table.name, [...table.data] as SNRecord[]);
  }
}

/** Get all loaded table definitions */
export function getTableDefinitions(): TableDefinition[] {
  return Array.from(tables.values());
}

/** Get a specific table definition */
export function getTableDefinition(
  tableName: string
): TableDefinition | undefined {
  return tables.get(tableName);
}

/** Simulate network delay */
function delay(ms: number = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Generate a unique sys_id */
function generateSysId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/** Apply filters to a record */
function matchesFilters(record: SNRecord, filters: FilterCondition[]): boolean {
  if (!filters.length) return true;

  let result = true;
  let currentConjunction: 'AND' | 'OR' = 'AND';

  for (const filter of filters) {
    const value = String(record[filter.field] ?? '');
    const filterValue = filter.value.toLowerCase();
    const recordValue = value.toLowerCase();

    let matches = false;
    switch (filter.operator) {
      case 'is':
        matches = recordValue === filterValue;
        break;
      case 'is_not':
        matches = recordValue !== filterValue;
        break;
      case 'contains':
        matches = recordValue.includes(filterValue);
        break;
      case 'starts_with':
        matches = recordValue.startsWith(filterValue);
        break;
      case 'ends_with':
        matches = recordValue.endsWith(filterValue);
        break;
      case 'greater_than':
        matches = recordValue > filterValue;
        break;
      case 'less_than':
        matches = recordValue < filterValue;
        break;
    }

    if (currentConjunction === 'AND') {
      result = result && matches;
    } else {
      result = result || matches;
    }

    currentConjunction = filter.conjunction ?? 'AND';
  }

  return result;
}

/** Get records from a table with optional filtering, sorting, and pagination */
export async function getRecords(
  tableName: string,
  query: QueryParams = {}
): Promise<ListResponse> {
  await delay();

  const tableData = data.get(tableName);
  if (!tableData) {
    throw new Error(`Table "${tableName}" not found`);
  }

  let records = [...tableData];

  // Apply search filter across all string fields
  if (query.search) {
    const searchLower = query.search.toLowerCase();
    const tableDef = tables.get(tableName);
    const stringFields =
      tableDef?.fields
        .filter((f) => f.type === 'string' || f.type === 'text')
        .map((f) => f.name) ?? [];

    records = records.filter((record) =>
      stringFields.some((field) => {
        const value = record[field];
        return (
          typeof value === 'string' && value.toLowerCase().includes(searchLower)
        );
      })
    );
  }

  // Apply filters
  if (query.filters?.length) {
    records = records.filter((record) =>
      matchesFilters(record, query.filters!)
    );
  }

  // Sort
  if (query.sortField) {
    const direction = query.sortDirection === 'desc' ? -1 : 1;
    records.sort((a, b) => {
      const aVal = String(a[query.sortField!] ?? '');
      const bVal = String(b[query.sortField!] ?? '');
      return aVal.localeCompare(bVal) * direction;
    });
  }

  // Paginate
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const paginatedRecords = records.slice(start, start + pageSize);

  return {
    data: paginatedRecords,
    total: records.length,
    page,
    pageSize,
  };
}

/** Get a single record by sys_id */
export async function getRecord(
  tableName: string,
  sysId: string
): Promise<SNRecord | null> {
  await delay();

  const tableData = data.get(tableName);
  if (!tableData) {
    throw new Error(`Table "${tableName}" not found`);
  }

  return tableData.find((r) => r.sys_id === sysId) ?? null;
}

/** Create a new record */
export async function createRecord(
  tableName: string,
  recordData: Partial<SNRecord>
): Promise<SNRecord> {
  await delay();

  const tableData = data.get(tableName);
  if (!tableData) {
    throw new Error(`Table "${tableName}" not found`);
  }

  const newRecord: SNRecord = {
    ...recordData,
    sys_id: generateSysId(),
    sys_created_on: new Date().toISOString(),
    sys_updated_on: new Date().toISOString(),
  };

  tableData.push(newRecord);
  await persistToServer(tableName);
  return newRecord;
}

/** Update an existing record */
export async function updateRecord(
  tableName: string,
  sysId: string,
  updates: Partial<SNRecord>
): Promise<SNRecord> {
  await delay();

  const tableData = data.get(tableName);
  if (!tableData) {
    throw new Error(`Table "${tableName}" not found`);
  }

  const index = tableData.findIndex((r) => r.sys_id === sysId);
  if (index === -1) {
    throw new Error(`Record "${sysId}" not found in table "${tableName}"`);
  }

  const updatedRecord: SNRecord = {
    ...tableData[index],
    ...updates,
    sys_id: sysId, // Prevent sys_id from being overwritten
    sys_updated_on: new Date().toISOString(),
  };

  tableData[index] = updatedRecord;
  await persistToServer(tableName);
  return updatedRecord;
}

/** Delete a record */
export async function deleteRecord(
  tableName: string,
  sysId: string
): Promise<void> {
  await delay();

  const tableData = data.get(tableName);
  if (!tableData) {
    throw new Error(`Table "${tableName}" not found`);
  }

  const index = tableData.findIndex((r) => r.sys_id === sysId);
  if (index === -1) {
    throw new Error(`Record "${sysId}" not found in table "${tableName}"`);
  }

  tableData.splice(index, 1);
  await persistToServer(tableName);
}

/** Get display value for a reference field */
export async function getDisplayValue(
  tableName: string,
  sysId: string,
  displayField: string = 'name'
): Promise<string> {
  const record = await getRecord(tableName, sysId);
  if (!record) return '';
  return String(record[displayField] ?? record.sys_id);
}

/** Get related records where a field equals a specific value */
export async function getRelatedRecords(
  tableName: string,
  parentField: string,
  parentSysId: string
): Promise<ListResponse> {
  await delay();

  const tableData = data.get(tableName);
  if (!tableData) {
    return { data: [], total: 0, page: 1, pageSize: 20 };
  }

  const records = tableData.filter(
    (record) => record[parentField] === parentSysId
  );

  return {
    data: records,
    total: records.length,
    page: 1,
    pageSize: records.length,
  };
}
