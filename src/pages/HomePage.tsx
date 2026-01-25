import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { SNButton } from '../components/sn/common';
import { TableImporter } from '../components/sn/TableImporter';
import { List, FileText } from 'lucide-react';

/**
 * Landing page showing available tables
 */
export function HomePage() {
  const { tables, isLoading, registerTable } = useData();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="animate-spin h-8 w-8 border-4 border-sn-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-header font-bold text-sn-neutral-9 mb-2">
        {/* Up Now */}
      </h1>

      <TableImporter onImportSuccess={registerTable} />

      <p className="text-sn-neutral-7 mb-8">
        Select a table to view its list or create a new record.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {tables.map((table) => (
          <div
            key={table.name}
            onClick={() => navigate(`/${table.name}/list`)}
            className="bg-white border border-sn-neutral-3 rounded-sn-lg p-6 hover:shadow-sn-2 transition-shadow cursor-pointer"
          >
            <h2 className="text-lg font-semibold text-sn-neutral-9 mb-1">
              {table.labelPlural || table.label}
            </h2>
            <p className="text-sm text-sn-neutral-6 mb-4">
              {table.data.length} records • {table.fields.length} fields
            </p>
            <div className="flex gap-2">
              <Link to={`/${table.name}/list`} onClick={(e) => e.stopPropagation()}>
                <SNButton
                  variant="secondary"
                  size="sm"
                  icon={<List className="w-4 h-4" />}
                >
                  View List
                </SNButton>
              </Link>
              <Link to={`/${table.name}/new`} onClick={(e) => e.stopPropagation()}>
                <SNButton
                  variant="primary"
                  size="sm"
                  icon={<FileText className="w-4 h-4" />}
                >
                  New Record
                </SNButton>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
