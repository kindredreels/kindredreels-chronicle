import { useMemo, useState } from 'react'
import type { SnapshotsData, CategoryStat } from '../../types'
import { getCategoryDetails, formatNumber } from '../../utils/dataProcessing'
import { COLORS, CATEGORY_NAMES } from '../../constants/categories'
import Card from '../shared/Card'

interface CategoryTableProps {
  data: SnapshotsData
}

type SortKey = 'lines' | 'files' | 'avgPerFile' | 'percent'

export default function CategoryTable({ data }: CategoryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('lines')
  const [sortAsc, setSortAsc] = useState(false)

  const baseDetails = useMemo(() => getCategoryDetails(data), [data])

  const sorted = useMemo(() => {
    const copy = [...baseDetails]
    copy.sort((a: CategoryStat, b: CategoryStat) => {
      const diff = a[sortKey] - b[sortKey]
      return sortAsc ? diff : -diff
    })
    return copy
  }, [baseDetails, sortKey, sortAsc])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return ''
    return sortAsc ? ' \u25B2' : ' \u25BC'
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Category Details (Latest)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="py-3 px-4 text-gray-400 font-medium">Category</th>
              <th
                className="py-3 px-4 text-gray-400 font-medium text-right cursor-pointer hover:text-gray-200"
                onClick={() => handleSort('lines')}
              >
                Lines{sortIndicator('lines')}
              </th>
              <th
                className="py-3 px-4 text-gray-400 font-medium text-right cursor-pointer hover:text-gray-200"
                onClick={() => handleSort('files')}
              >
                Files{sortIndicator('files')}
              </th>
              <th
                className="py-3 px-4 text-gray-400 font-medium text-right cursor-pointer hover:text-gray-200"
                onClick={() => handleSort('avgPerFile')}
              >
                Avg Lines/File{sortIndicator('avgPerFile')}
              </th>
              <th
                className="py-3 px-4 text-gray-400 font-medium text-right cursor-pointer hover:text-gray-200"
                onClick={() => handleSort('percent')}
              >
                % of Total{sortIndicator('percent')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr key={row.category} className="border-b border-gray-700 hover:bg-blue-500/10">
                <td className="py-3 px-4">
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
                    style={{ backgroundColor: COLORS[row.category] }}
                  />
                  {CATEGORY_NAMES[row.category]}
                </td>
                <td className="py-3 px-4 text-right font-mono">{formatNumber(row.lines)}</td>
                <td className="py-3 px-4 text-right font-mono">{formatNumber(row.files)}</td>
                <td className="py-3 px-4 text-right font-mono">{formatNumber(row.avgPerFile)}</td>
                <td className="py-3 px-4 text-right font-mono">{row.percent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
