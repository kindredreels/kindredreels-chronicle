import { useState, useRef, useEffect } from 'react'

const PRIMARY_TABS = ['Overview', 'Story', 'Growth'] as const
const MORE_TABS = ['Timeline', 'Code Stats'] as const
const ALL_TABS = [...PRIMARY_TABS, ...MORE_TABS] as const
export type Tab = (typeof ALL_TABS)[number]

interface TabBarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  const isMoreTab = (MORE_TABS as readonly string[]).includes(activeTab)

  useEffect(() => {
    if (!moreOpen) return
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [moreOpen])

  const tabClass = (active: boolean) =>
    `whitespace-nowrap px-3 sm:px-4 py-2 text-sm font-medium transition-colors ${
      active
        ? 'text-blue-400 border-b-2 border-blue-400'
        : 'text-gray-400 hover:text-gray-200'
    }`

  return (
    <div className="flex gap-1 border-b border-gray-700">
      {PRIMARY_TABS.map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={tabClass(activeTab === tab)}
        >
          {tab}
        </button>
      ))}
      <div className="relative" ref={moreRef}>
        <button
          onClick={() => setMoreOpen(prev => !prev)}
          className={tabClass(isMoreTab)}
        >
          {isMoreTab ? activeTab : 'More'}
          <span className="ml-1 text-xs">▾</span>
        </button>
        {moreOpen && (
          <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-[140px]">
            {MORE_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => { onTabChange(tab); setMoreOpen(false) }}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                  activeTab === tab
                    ? 'text-blue-400 bg-gray-700/50'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
