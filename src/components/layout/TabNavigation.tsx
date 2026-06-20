'use client'

interface TabNavigationProps {
  activeTab: 'chat' | 'code'
  onTabChange: (tab: 'chat' | 'code') => void
}

const TABS = [
  { id: 'chat' as const, label: 'Chat' },
  { id: 'code' as const, label: 'Code' },
] as const

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div
      role="tablist"
      aria-label="モード切り替え"
      className="flex border-b border-[var(--border)] bg-[var(--surface)]"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={[
            'px-4 py-2 text-sm font-medium transition-colors relative',
            activeTab === tab.id
              ? 'text-[var(--foreground)]'
              : 'text-[var(--text-muted)] hover:text-[var(--foreground)]',
          ].join(' ')}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--foreground)]" />
          )}
        </button>
      ))}
    </div>
  )
}
