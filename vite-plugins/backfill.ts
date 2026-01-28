import fs from 'node:fs';
import path from 'node:path';
import type { TableDefinition, SNRecord } from '../src/types';

interface SNTableResponse {
  result: Array<Record<string, unknown>>;
}

/** Get list of table names that exist locally */
export function getLocalTables(tablesDir: string): string[] {
  try {
    const files = fs.readdirSync(tablesDir);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''));
  } catch {
    return [];
  }
}

/** Load a local table's current data */
export function loadLocalTableData(
  tablesDir: string,
  tableName: string,
): { tableDef: TableDefinition; sysIds: Set<string> } | null {
  try {
    // Read table definition from tables/
    const defFilePath = path.join(tablesDir, `${tableName}.json`);
    if (!fs.existsSync(defFilePath)) return null;

    const defContent = fs.readFileSync(defFilePath, 'utf-8');
    const tableConfig = JSON.parse(defContent);

    // Read record data from recordData/ (sibling directory)
    const recordDataDir = path.join(path.dirname(tablesDir), 'recordData');
    const dataFilePath = path.join(recordDataDir, `${tableName}.json`);

    let data: SNRecord[] = [];
    if (fs.existsSync(dataFilePath)) {
      const dataContent = fs.readFileSync(dataFilePath, 'utf-8');
      data = JSON.parse(dataContent);
    } else if (tableConfig?.data && Array.isArray(tableConfig.data)) {
      // Fallback: use embedded data if present (backwards compat)
      data = tableConfig.data;
    }

    const tableDef: TableDefinition = { ...tableConfig, data };
    const sysIds = new Set(data.map((r) => r.sys_id));
    return { tableDef, sysIds };
  } catch {
    return null;
  }
}

/** Extract sys_id from a field value (handles both old format and new {value, display_value} format) */
function extractSysId(fieldValue: unknown): string | null {
  if (!fieldValue) return null;
  if (typeof fieldValue === 'string') return fieldValue || null;
  if (typeof fieldValue === 'object' && 'value' in fieldValue) {
    const val = (fieldValue as { value: string }).value;
    return val || null;
  }
  return null;
}

/** Find missing references in imported data for tables that exist locally */
export function findMissingReferences(
  tableDef: TableDefinition,
  tablesDir: string,
): Map<string, Set<string>> {
  const localTables = getLocalTables(tablesDir);
  const missingByTable = new Map<string, Set<string>>();

  // Find reference fields that point to local tables
  const referenceFields = tableDef.fields.filter(
    (f) =>
      f.type === 'reference' &&
      f.reference &&
      localTables.includes(f.reference),
  );

  if (referenceFields.length === 0) return missingByTable;

  // Collect all referenced sys_ids per table
  const referencedByTable = new Map<string, Set<string>>();
  for (const field of referenceFields) {
    const refTable = field.reference!;
    if (!referencedByTable.has(refTable)) {
      referencedByTable.set(refTable, new Set());
    }
    const sysIds = referencedByTable.get(refTable)!;

    for (const record of tableDef.data) {
      const sysId = extractSysId(record[field.name]);
      if (sysId) {
        sysIds.add(sysId);
      }
    }
  }

  // Compare against local data to find missing
  for (const [refTable, referencedIds] of referencedByTable) {
    const localData = loadLocalTableData(tablesDir, refTable);
    if (!localData) continue;

    const missing = new Set<string>();
    for (const sysId of referencedIds) {
      if (!localData.sysIds.has(sysId)) {
        missing.add(sysId);
      }
    }

    if (missing.size > 0) {
      missingByTable.set(refTable, missing);
    }
  }

  return missingByTable;
}

/** Transform a raw ServiceNow record to our format */
function transformRecord(record: Record<string, unknown>): SNRecord {
  const transformed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key === 'sys_id') {
      transformed[key] =
        typeof value === 'object' && value !== null && 'value' in value
          ? (value as { value: string }).value
          : String(value);
    } else if (
      typeof value === 'object' &&
      value !== null &&
      'value' in value
    ) {
      const snValue = value as { value: string; display_value?: string };
      transformed[key] = {
        value: snValue.value ?? '',
        display_value: snValue.display_value ?? snValue.value ?? '',
      };
    } else {
      const strValue =
        value === null || value === undefined ? '' : String(value);
      transformed[key] = { value: strValue, display_value: strValue };
    }
  }
  return transformed as SNRecord;
}

/** Fetch missing records from ServiceNow in batches */
export async function fetchMissingRecords(
  instance: string,
  tableName: string,
  sysIds: Set<string>,
  authHeader: string,
): Promise<SNRecord[]> {
  const allRecords: SNRecord[] = [];
  const idsArray = Array.from(sysIds);

  // Batch in groups of 50 to avoid URL length limits
  const batchSize = 50;
  for (let i = 0; i < idsArray.length; i += batchSize) {
    const batch = idsArray.slice(i, i + batchSize);
    const query = `sys_idIN${batch.join(',')}`;
    const url = `${instance}/api/now/table/${tableName}?sysparm_query=${query}&sysparm_display_value=all`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: authHeader, Accept: 'application/json' },
      });

      if (response.ok) {
        const data = (await response.json()) as SNTableResponse;
        for (const record of data.result) {
          allRecords.push(transformRecord(record));
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch batch from ${tableName}:`, error);
    }
  }

  return allRecords;
}

/** Append new records to a local table's record data file */
export function appendToLocalTable(
  tablesDir: string,
  tableName: string,
  newRecords: SNRecord[],
): void {
  const recordDataDir = path.join(path.dirname(tablesDir), 'recordData');
  const dataFilePath = path.join(recordDataDir, `${tableName}.json`);

  // Ensure recordData directory exists
  if (!fs.existsSync(recordDataDir)) {
    fs.mkdirSync(recordDataDir, { recursive: true });
  }

  // Read existing records (or start with empty array)
  let data: SNRecord[] = [];
  if (fs.existsSync(dataFilePath)) {
    const content = fs.readFileSync(dataFilePath, 'utf-8');
    data = JSON.parse(content);
  }

  // Append new records
  data.push(...newRecords);

  // Write back just the records array
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2) + '\n');
}

/** Backfill missing first-level references for local tables */
export async function backfillReferences(
  tableDef: TableDefinition,
  tablesDir: string,
  instance: string,
  authHeader: string,
): Promise<Record<string, number>> {
  const backfilled: Record<string, number> = {};

  const missingByTable = findMissingReferences(tableDef, tablesDir);

  for (const [refTable, missingSysIds] of missingByTable) {
    console.log(
      `Backfilling ${missingSysIds.size} missing records from ${refTable}...`,
    );

    const newRecords = await fetchMissingRecords(
      instance,
      refTable,
      missingSysIds,
      authHeader,
    );

    if (newRecords.length > 0) {
      appendToLocalTable(tablesDir, refTable, newRecords);
      backfilled[refTable] = newRecords.length;
    }
  }

  return backfilled;
}
