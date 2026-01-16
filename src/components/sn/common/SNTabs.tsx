import { useState, type ReactNode } from 'react'
import { cn } from '../../../utils/cn'
import { SNBadge } from './SNBadge'

export interface SNTab {
  id: string
  label: string
  count?: number
  content?: ReactNode
  disabled?: boolean
}

export interface SNTabsProps {
  /** Tab definitions */
  tabs: SNTab[]
  /** Currently active tab ID */
  activeTab?: string
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void
  /** Visual variant */
  variant?: 'default' | 'underline'
  /** Additional CSS classes */
  className?: string
}

/**
 * ServiceNow-styled tabs component
 *
 * @example
 * <SNTabs
 *   tabs={[
 *     { id: 'notes', label: 'Notes', count: 3 },
 *     { id: 'related', label: 'Related Records' },
 *   ]}
 *   activeTab="notes"
 *   onTabChange={setActiveTab}
 * />
 */
export function SNTabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline',
  className,
}: SNTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.id)
  const currentTab = activeTab ?? internalActiveTab

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId)
    } else {
      setInternalActiveTab(tabId)
    }
  }

  const activeTabContent = tabs.find(tab => tab.id === currentTab)?.content

  return (
    <div className={className}>
      <div
        className={cn(
          'flex gap-1',
          variant === 'underline' && 'border-b border-sn-neutral-3'
        )}
        role="tablist"
      >
        {tabs.map(tab => {
          const isActive = tab.id === currentTab

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sn-primary',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variant === 'underline' && [
                  '-mb-px border-b-2',
                  isActive
                    ? 'border-sn-positive text-sn-positive'
                    : 'border-transparent text-sn-neutral-7 hover:text-sn-neutral-9 hover:border-sn-neutral-4',
                ],
                variant === 'default' && [
                  'rounded-t-sn',
                  isActive
                    ? 'bg-white text-sn-neutral-9 border border-b-0 border-sn-neutral-3'
                    : 'text-sn-neutral-7 hover:text-sn-neutral-9 hover:bg-sn-neutral-1',
                ]
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <SNBadge variant={isActive ? 'primary' : 'default'} size="sm">
                  {tab.count}
                </SNBadge>
              )}
            </button>
          )
        })}
      </div>
      {activeTabContent && (
        <div role="tabpanel" className="py-4">
          {activeTabContent}
        </div>
      )}
    </div>
  )
}
