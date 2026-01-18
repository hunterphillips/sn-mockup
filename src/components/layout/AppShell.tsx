import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { SNHeader, SNNavMenu } from '../sn/Navigation'
import { useNav } from '../../context/NavContext'

export interface AppShellProps {
  /** Page content */
  children: ReactNode
  /** Additional CSS classes for the content area */
  className?: string
}

/**
 * Main application shell with header and content area
 *
 * @example
 * <AppShell>
 *   <ListPage />
 * </AppShell>
 */
export function AppShell({ children, className }: AppShellProps) {
  const { isNavPinned } = useNav()

  return (
    <div className="min-h-screen flex flex-col bg-sn-neutral-1">
      <SNHeader />
      <div className="flex-1 flex">
        {/* Pinned Sidebar */}
        {isNavPinned && (
          <aside className="shrink-0">
            <SNNavMenu className="h-[calc(100vh-48px)]" />
          </aside>
        )}
        <main className={cn('flex-1 min-w-0', className)}>
          {children}
        </main>
      </div>
    </div>
  )
}
