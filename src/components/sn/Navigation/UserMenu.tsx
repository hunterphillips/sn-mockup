import { useState, useRef, useEffect } from 'react'
import { cn } from '../../../utils/cn'
import { SNAvatar } from '../common/SNAvatar'
import type { UserProfile } from '../../../types'
import {
  User,
  Settings,
  Keyboard,
  Eye,
  ArrowUp,
  Printer,
  LogOut,
  Building,
} from 'lucide-react'

export interface UserMenuProps {
  /** Current user profile */
  user: UserProfile
  /** Additional CSS classes */
  className?: string
}

interface MenuItemProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}

function MenuItem({ icon, label, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-colors"
    >
      <span className="text-white/70">{icon}</span>
      {label}
    </button>
  )
}

/**
 * ServiceNow user profile dropdown menu
 *
 * @example
 * <UserMenu user={currentUser} />
 */
export function UserMenu({ user, className }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded hover:bg-white/10 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <SNAvatar name={user.name} src={user.avatar} size="sm" />
        {/* Online indicator */}
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-sn-chrome rounded-full" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-sn-chrome-light rounded-sn-lg shadow-sn-5 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Info Header */}
          <div className="p-4 flex items-center gap-4 bg-sn-chrome">
            <SNAvatar name={user.name} src={user.avatar} size="xl" />
            <div>
              <div className="text-white font-semibold text-lg">{user.name}</div>
              <div className="flex items-center gap-1.5 text-white/70 text-sm">
                <Building className="w-4 h-4" />
                {user.company || 'ServiceNow'}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <MenuItem icon={<User className="w-5 h-5" />} label="Profile" />
            <MenuItem icon={<Settings className="w-5 h-5" />} label="Preferences" />
            <MenuItem icon={<Keyboard className="w-5 h-5" />} label="Keyboard shortcuts" />
          </div>

          <div className="border-t border-white/10 py-2">
            <MenuItem icon={<Eye className="w-5 h-5" />} label="Impersonate user" />
            <MenuItem icon={<ArrowUp className="w-5 h-5" />} label="Elevate role" />
            <MenuItem icon={<Printer className="w-5 h-5" />} label="Printer friendly version" />
          </div>

          <div className="border-t border-white/10 py-2">
            <MenuItem icon={<LogOut className="w-5 h-5" />} label="Log out" />
          </div>
        </div>
      )}
    </div>
  )
}
