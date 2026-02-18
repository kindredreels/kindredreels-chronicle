import { useMemo } from 'react'
import type { SnapshotsData } from '../types'
import { fillMissingDays } from '../utils/dataProcessing'
import rawData from '../../data/snapshots.json'

export function useSnapshotsData(): SnapshotsData {
  return useMemo(() => {
    const data = rawData as SnapshotsData
    return {
      ...data,
      days: fillMissingDays(data.days)
    }
  }, [])
}
