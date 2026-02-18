import { useMemo } from 'react'
import type { ChronicleData, ChronicleEntry } from '../types'
import rawData from '../../data/chronicle-data.json'

export interface ChronicleDataWithLookup extends ChronicleData {
  entriesById: Record<string, ChronicleEntry>
}

export function useChronicleData(): ChronicleDataWithLookup {
  return useMemo(() => {
    const data = rawData as ChronicleData
    const entriesById: Record<string, ChronicleEntry> = {}
    for (const entry of data.entries) {
      entriesById[entry.id] = entry
    }
    return { ...data, entriesById }
  }, [])
}
