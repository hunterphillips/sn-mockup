import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { useData } from '../../../context/DataContext';
import { useNav } from '../../../context/NavContext';
import {
  Filter,
  X,
  RefreshCw,
  ArrowRightToLine,
  ArrowLeftToLine,
} from 'lucide-react';

export interface SNNavMenuProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Navigation menu panel showing available tables
 * Can be displayed as dropdown (unpinned) or sidebar (pinned)
 */
export function SNNavMenu({ className }: SNNavMenuProps) {
  const { tables } = useData();
  const { isNavPinned, setNavOpen, toggleNavPin } = useNav();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get current table from URL
  const currentTable = location.pathname.split('/')[1] || null;

  // Filter tables by search query
  const filteredTables = tables.filter((table) => {
    const label = table.labelPlural || table.label;
    return label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Handle click outside to close (only when unpinned)
  useEffect(() => {
    if (isNavPinned) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Check if click was on the "All" button (don't close)
        const target = e.target as HTMLElement;
        if (target.closest('[data-nav-trigger]')) return;
        setNavOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNavOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isNavPinned, setNavOpen]);

  const handleTableClick = () => {
    // Close menu on navigation only when unpinned
    if (!isNavPinned) {
      setNavOpen(false);
    }
  };

  return (
    <div
      ref={menuRef}
      className={cn(
        'bg-sn-chrome text-white flex flex-col',
        isNavPinned ? 'w-[350px] h-full' : 'w-[350px] max-h-[calc(100vh-48px)]',
        className,
      )}
    >
      {/* Search and Toolbar */}
      <div className="p-3 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white/10 rounded px-3 py-1.5">
          <Filter className="w-4 h-4 text-white/60" />
          <input
            type="text"
            placeholder="Filter"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/60 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-0.5 hover:bg-white/10 rounded"
            >
              <X className="w-3.5 h-3.5 text-white/60" />
            </button>
          )}
        </div>
        <button
          className="p-2 hover:bg-white/10 rounded transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-white/80" />
        </button>
        <button
          onClick={toggleNavPin}
          className="p-2 hover:bg-white/10 rounded transition-colors"
          aria-label={isNavPinned ? 'Unpin menu' : 'Pin menu'}
        >
          {isNavPinned ? (
            <ArrowLeftToLine className="w-4 h-4 text-white/80" />
          ) : (
            <ArrowRightToLine className="w-4 h-4 text-white/80" />
          )}
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Favorites Section */}
        {searchQuery && (
          <div className="px-3 py-2">
            <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
              Favorites
            </div>
            <div className="text-sm text-white/50 pl-2">No Results</div>
          </div>
        )}

        {/* All Results Section */}
        <div className="px-3 py-2">
          {searchQuery && (
            <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
              All Results
            </div>
          )}
          <nav className="space-y-0.5">
            {filteredTables.map((table) => {
              const isActive = currentTable === table.name;
              return (
                <Link
                  key={table.name}
                  to={`/${table.name}/list`}
                  onClick={handleTableClick}
                  className={cn(
                    'block px-3 py-1.5 text-sm rounded transition-colors',
                    isActive
                      ? 'bg-sn-primary text-white'
                      : 'text-white/90 hover:bg-white/10',
                  )}
                >
                  {table.labelPlural || table.label}
                </Link>
              );
            })}
            {filteredTables.length === 0 && (
              <div className="text-sm text-white/50 pl-3">
                No matching tables
              </div>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
