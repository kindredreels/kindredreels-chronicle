import { useState } from 'react'
import type { ChronicleEntry } from '../../types'
import CategoryBadge from './CategoryBadge'
import SignificanceDot from './SignificanceDot'
import TagList from './TagList'

interface EntryDetailProps {
  entry: ChronicleEntry
}

function formatNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

export default function EntryDetail({ entry }: EntryDetailProps) {
  const [showCommits, setShowCommits] = useState(false)
  const [showFiles, setShowFiles] = useState(false)

  const date = new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  return (
    <div className="space-y-4 pt-3">
      <div className="flex items-center gap-2 flex-wrap">
        <CategoryBadge category={entry.category} />
        <SignificanceDot significance={entry.significance} showLabel />
        <span className="text-xs text-gray-500">{date}</span>
      </div>

      <p className="text-gray-300 text-sm">{entry.summary}</p>

      {entry.detail && (
        <p className="text-gray-400 text-sm leading-relaxed">{entry.detail}</p>
      )}

      <div className="flex gap-4 text-sm">
        <span className="text-green-400">+{formatNum(entry.stats.additions)}</span>
        <span className="text-red-400">-{formatNum(entry.stats.deletions)}</span>
        <span className="text-gray-500">{entry.stats.changedFiles} files</span>
      </div>

      <TagList tags={entry.tags} />

      {entry.prNumber !== null && (
        <a
          href={`https://github.com/kindredreels/kindredreels/pull/${entry.prNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-blue-400 hover:text-blue-300"
        >
          PR #{entry.prNumber} &rarr;
        </a>
      )}

      {entry.commitMessages.length > 0 && (
        <div>
          <button
            onClick={() => setShowCommits(!showCommits)}
            className="text-sm text-gray-400 hover:text-gray-300 transition"
          >
            {showCommits ? '▾' : '▸'} Commit messages ({entry.commitMessages.length})
          </button>
          {showCommits && (
            <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
              {entry.commitMessages.map((msg, i) => (
                <pre key={i} className="text-xs text-gray-500 bg-gray-900 rounded p-3 whitespace-pre-wrap font-mono">
                  {msg}
                </pre>
              ))}
            </div>
          )}
        </div>
      )}

      {entry.filesChanged.length > 0 && (
        <div>
          <button
            onClick={() => setShowFiles(!showFiles)}
            className="text-sm text-gray-400 hover:text-gray-300 transition"
          >
            {showFiles ? '▾' : '▸'} Files changed ({entry.filesChanged.length})
          </button>
          {showFiles && (
            <div className="mt-2 max-h-64 overflow-y-auto overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-700">
                    <th className="text-left py-1 font-medium">Path</th>
                    <th className="text-right py-1 font-medium w-16">+</th>
                    <th className="text-right py-1 font-medium w-16">-</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.filesChanged.map(f => (
                    <tr key={f.path} className="border-b border-gray-800">
                      <td className="py-1 text-gray-400 font-mono truncate max-w-xs">{f.path}</td>
                      <td className="text-right py-1 text-green-400">{f.additions}</td>
                      <td className="text-right py-1 text-red-400">{f.deletions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
