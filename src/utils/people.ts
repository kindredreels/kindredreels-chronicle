import type { ChronicleEntry } from '../types'

/**
 * Sadie Bilenkin joined in December 2025. Her work is a small share of the
 * pull requests and lines, so the app points it out wherever it appears.
 * An entry is hers when she authored commits in it, or when it is tagged
 * `sadie` (her branch merged through Dimitri's commits, or her photo on the
 * About page).
 */
export const SADIE = 'Sadie Bilenkin'
export const SADIE_COLOR = '#F472B6'

export function isSadieEntry(entry: ChronicleEntry): boolean {
  return (entry.authors ?? []).includes(SADIE) || entry.tags.includes('sadie')
}
