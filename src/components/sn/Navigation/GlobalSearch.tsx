import { useState } from 'react';
import { cn } from '../../../utils/cn';
import { Search, ChevronDown } from 'lucide-react';

export interface GlobalSearchProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * ServiceNow global search in header
 *
 * @example
 * <GlobalSearch />
 */
export function GlobalSearch({ className }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={cn('flex items-center', className)}>
      <div
        className={cn(
          'flex items-center bg-white/10 rounded-l transition-all',
          isFocused && 'bg-white/20 ring-2 ring-white/30',
        )}
      >
        <Search className="w-4 h-4 text-white/70 ml-3" />
        <input
          type="text"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'bg-transparent text-white placeholder:text-white/60',
            'w-48 px-3 py-1.5 text-sm',
            'focus:outline-none focus:w-64 transition-all',
          )}
        />
      </div>
    </div>
  );
}
