import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { SNHeader } from '../sn/Navigation'

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
  return (
    <div className="min-h-screen flex flex-col bg-sn-neutral-1">
      <SNHeader />
      <main className={cn('flex-1', className)}>
        {children}
      </main>
    </div>
  )
}
