import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { GlobalSearch } from './GlobalSearch';
import { AppPill } from './AppPill';
import { UserMenu } from './UserMenu';
import { SNNavMenu } from './SNNavMenu';
import { useData } from '../../../context/DataContext';
import { useNav } from '../../../context/NavContext';
import {
  LayoutGrid,
  Star,
  Clock,
  MoreVertical,
  Globe,
  MessageSquare,
  HelpCircle,
  Bell,
} from 'lucide-react';

export interface SNHeaderProps {
  /** Additional CSS classes */
  className?: string;
}

interface NavItemProps {
  icon?: React.ReactNode;
  label: string;
  to?: string;
  active?: boolean;
  onClick?: () => void;
  'data-nav-trigger'?: boolean;
}

function NavItem({ icon, label, to, active, onClick, ...props }: NavItemProps) {
  const baseStyles = cn(
    'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors',
    'text-white/90 hover:text-white hover:bg-white/10',
    active && 'bg-white/10 text-white',
  );

  if (to) {
    return (
      <Link to={to} className={baseStyles} {...props}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <button className={baseStyles} onClick={onClick} {...props}>
      {icon}
      {label}
    </button>
  );
}

function IconButton({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
      aria-label={label}
    >
      {children}
    </button>
  );
}

/**
 * ServiceNow unified navigation header
 *
 * @example
 * <SNHeader />
 */
export function SNHeader({ className }: SNHeaderProps) {
  const { currentUser } = useData();
  const { isNavOpen, isNavPinned, setNavOpen } = useNav();
  const location = useLocation();

  // Determine current app from URL
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentTable = pathParts[0] || null;
  const currentRecordId =
    pathParts[1] !== 'list' && pathParts[1] !== 'new' ? pathParts[1] : null;

  const handleAllClick = () => {
    if (isNavPinned) {
      // If pinned, clicking All unpins and closes
      setNavOpen(false);
    } else {
      // Toggle open/close
      setNavOpen(!isNavOpen);
    }
  };

  return (
    <header
      className={cn(
        'bg-sn-chrome h-12 flex items-center px-4 gap-4 relative z-50',
        className,
      )}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <span className="text-white font-header font-bold text-lg tracking-tight">
          service<span className="font-normal">now</span>
        </span>
      </Link>

      {/* Primary Navigation */}
      <nav className="flex items-center gap-1">
        <NavItem
          icon={<LayoutGrid className="w-4 h-4" />}
          label="All"
          active={isNavOpen || isNavPinned}
          onClick={handleAllClick}
          data-nav-trigger
        />
        <NavItem icon={<Star className="w-4 h-4" />} label="Favorites" />
        <NavItem icon={<Clock className="w-4 h-4" />} label="History" />
        {/* <NavItem icon={<LayoutDashboard className="w-4 h-4" />} label="Workspaces" /> */}
        <button className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded">
          <MoreVertical className="w-4 h-4" />
        </button>
      </nav>

      {/* Nav Menu Dropdown (only when unpinned) */}
      {isNavOpen && !isNavPinned && (
        <div className="absolute top-12 left-0 shadow-sn-5 z-50">
          <SNNavMenu />
        </div>
      )}

      {/* App Pill - Current Location */}
      <div className="flex-1 flex justify-center">
        {currentTable && (
          <AppPill table={currentTable} recordId={currentRecordId} />
        )}
      </div>

      {/* Search */}
      <GlobalSearch />

      {/* Utility Icons */}
      <div className="flex items-center gap-1">
        <IconButton label="Scope">
          <Globe className="w-5 h-5" />
        </IconButton>
        <IconButton label="Connect">
          <MessageSquare className="w-5 h-5" />
        </IconButton>
        <IconButton label="Help">
          <HelpCircle className="w-5 h-5" />
        </IconButton>
        <IconButton label="Notifications">
          <Bell className="w-5 h-5" />
        </IconButton>
      </div>

      {/* User Menu */}
      <UserMenu user={currentUser} />
    </header>
  );
}
