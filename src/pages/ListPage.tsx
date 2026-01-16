import { useParams } from 'react-router-dom'
import { SNList } from '../components/sn/List'

/**
 * List view page for any table
 */
export function ListPage() {
  const { table } = useParams<{ table: string }>()

  if (!table) {
    return <div className="p-8 text-sn-neutral-6">No table specified</div>
  }

  return <SNList tableName={table} className="h-[calc(100vh-48px)]" />
}
