import { SIZE_NAMES, type Size } from './game'
import type { BestRecords, Settings } from './session'
import { THEME_NAMES, type Theme } from './themes'

const SETTINGS_KEY = 'memory-match:settings'
const BEST_KEY = 'memory-match:best'

export const DEFAULT_SETTINGS: Settings = { size: 'medium', theme: 'animals' }

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: the game still works, it just won't remember.
  }
}

const isObject = (value: unknown): value is { [key: string]: unknown } =>
  !!value && typeof value === 'object' && !Array.isArray(value)

/** Saved settings, with the default for anything missing or invalid. */
export function loadSettings(): Settings {
  const saved = read(SETTINGS_KEY)
  if (!isObject(saved)) return DEFAULT_SETTINGS
  return {
    size: SIZE_NAMES.includes(saved.size as Size) ? (saved.size as Size) : DEFAULT_SETTINGS.size,
    theme: THEME_NAMES.includes(saved.theme as Theme) ? (saved.theme as Theme) : DEFAULT_SETTINGS.theme,
  }
}

export const saveSettings = (settings: Settings) => write(SETTINGS_KEY, settings)

const isWhole = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0

/** Saved records, skipping any that isn't a known size with whole, non-negative moves and time. */
export function loadBest(): BestRecords {
  const saved = read(BEST_KEY)
  if (!isObject(saved)) return {}
  const best: BestRecords = {}
  for (const size of SIZE_NAMES) {
    const record = saved[size]
    if (isObject(record) && isWhole(record.moves) && isWhole(record.time)) {
      best[size] = { moves: record.moves, time: record.time }
    }
  }
  return best
}

export const saveBest = (best: BestRecords) => write(BEST_KEY, best)
