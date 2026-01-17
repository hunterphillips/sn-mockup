import { useState } from 'react';
import { Download, CheckCircle, AlertCircle } from 'lucide-react';
import { SNButton, SNInput } from './common';
import { importTable, type ImportResult } from '../../api/importService';
import type { TableDefinition } from '../../types';

interface TableImporterProps {
  onImportSuccess?: (tableDef: TableDefinition) => void;
}

type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Component for importing ServiceNow table definitions from a live instance.
 * Requires VITE_SN_INSTANCE, VITE_SN_USERNAME, VITE_SN_PASSWORD env vars.
 */
export function TableImporter({ onImportSuccess }: TableImporterProps) {
  const [tableName, setTableName] = useState('');
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    if (!tableName.trim()) return;

    setStatus('loading');
    setResult(null);

    const importResult = await importTable(tableName.trim());
    setResult(importResult);

    if (importResult.success) {
      setStatus('success');
      setTableName('');
      if (importResult.tableDef && onImportSuccess) {
        onImportSuccess(importResult.tableDef);
      }
    } else {
      setStatus('error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tableName.trim() && status !== 'loading') {
      handleImport();
    }
  };

  return (
    <div className="bg-white border border-sn-neutral-3 rounded-sn-lg p-4 mb-6">
      <h2 className="text-sm font-semibold text-sn-neutral-9 mb-3">
        Table Import
      </h2>

      <div className="flex gap-2 mb-2">
        <SNInput
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Table name (e.g., cmdb_ci_server)"
          disabled={status === 'loading'}
          fullWidth
        />
        <SNButton
          variant="primary"
          onClick={handleImport}
          disabled={!tableName.trim()}
          loading={status === 'loading'}
          icon={<Download className="w-4 h-4" />}
        >
          Import
        </SNButton>
      </div>

      {status === 'success' && result && (
        <div className="flex items-center gap-2 text-sm text-sn-success">
          <CheckCircle className="w-4 h-4" />
          <span>
            Imported {result.tableName} ({result.fieldCount} fields,{' '}
            {result.recordCount} records)
          </span>
        </div>
      )}

      {status === 'error' && result && (
        <div className="flex items-center gap-2 text-sm text-sn-critical">
          <AlertCircle className="w-4 h-4" />
          <span>{result.error}</span>
        </div>
      )}
    </div>
  );
}
