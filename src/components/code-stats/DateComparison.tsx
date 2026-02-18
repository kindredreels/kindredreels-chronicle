import { useState, useMemo } from 'react'
import type { SnapshotsData } from '../../types'
import { compareDates, getAvailableDates, formatNumber } from '../../utils/dataProcessing'
import { CATEGORY_NAMES } from '../../constants/categories'
import Card from '../shared/Card'

interface DateComparisonProps {
  data: SnapshotsData
}

export default function DateComparison({ data }: DateComparisonProps) {
  const dates = useMemo(() => getAvailableDates(data), [data])
  const [fromDate, setFromDate] = useState(dates[0] || '')
  const [toDate, setToDate] = useState(dates[dates.length - 1] || '')
  const [results, setResults] = useState(() => compareDates(data, dates[0], dates[dates.length - 1]))

  const handleCompare = () => {
    setResults(compareDates(data, fromDate, toDate))
  }

  const minDate = dates[0]
  const maxDate = dates[dates.length - 1]

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Compare Two Dates</h2>
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            min={minDate}
            max={maxDate}
            onChange={e => setFromDate(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">To</label>
          <input
            type="date"
            value={toDate}
            min={minDate}
            max={maxDate}
            onChange={e => setToDate(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleCompare}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition"
          >
            Compare
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {results ? (
          results.map(r => {
            const deltaClass = r.delta > 0
              ? 'text-emerald-400'
              : r.delta < 0
                ? 'text-red-400'
                : 'text-gray-400'
            const deltaText = r.delta >= 0 ? `+${formatNumber(r.delta)}` : formatNumber(r.delta)

            return (
              <div key={r.category} className="bg-gray-700 rounded-lg p-3 text-center comparison-card">
                <div className="text-xs text-gray-400 mb-1">{CATEGORY_NAMES[r.category]}</div>
                <div className={`text-lg font-bold ${deltaClass}`}>{deltaText}</div>
                <div className="text-xs text-gray-500">{formatNumber(r.fromLines)} &rarr; {formatNumber(r.toLines)}</div>
              </div>
            )
          })
        ) : (
          <p className="text-gray-400 col-span-full">Select valid dates</p>
        )}
      </div>
    </Card>
  )
}
