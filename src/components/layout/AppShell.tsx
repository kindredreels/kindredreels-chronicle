import { useState } from 'react'
import TabBar from './TabBar'
import type { Tab } from './TabBar'
import CodeStatsView from '../code-stats/CodeStatsView'
import TimelineView from '../timeline/TimelineView'
import ChaptersView from '../chapters/ChaptersView'
import GrowthView from '../growth/GrowthView'
import { useSnapshotsData } from '../../hooks/useSnapshotsData'
import { useChronicleData } from '../../hooks/useChronicleData'

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('Code Stats')
  const data = useSnapshotsData()
  const chronicleData = useChronicleData()

  const lastUpdated = data.generatedAt
    ? new Date(data.generatedAt).toLocaleDateString() + ' ' + new Date(data.generatedAt).toLocaleTimeString()
    : null

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kindred Reels Chronicle</h1>
            <p className="text-gray-400 text-sm">Codebase analytics &amp; storytelling</p>
          </div>
          {lastUpdated && (
            <div className="text-gray-500 text-sm">Last updated: {lastUpdated}</div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-4">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'Code Stats' && <CodeStatsView data={data} />}
        {activeTab === 'Timeline' && <TimelineView data={chronicleData} />}
        {activeTab === 'Chapters' && <ChaptersView data={chronicleData} />}
        {activeTab === 'Growth' && <GrowthView data={chronicleData} />}
      </main>

      <footer className="border-t border-gray-700 mt-12 py-6 text-center text-gray-500 text-sm">
        <p>Kindred Reels Chronicle — Built with Claude Code</p>
      </footer>
    </div>
  )
}
