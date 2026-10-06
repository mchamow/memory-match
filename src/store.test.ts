import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS, loadBest, loadSettings, saveBest, saveSettings } from './store'

beforeEach(() => localStorage.clear())

describe('settings', () => {
  it('round-trips', () => {
    saveSettings({ size: 'large', theme: 'food' })
    expect(loadSettings()).toEqual({ size: 'large', theme: 'food' })
  })

  it('falls back to defaults when missing, corrupt or invalid', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    localStorage.setItem('memory-match:settings', '{oops')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    localStorage.setItem('memory-match:settings', JSON.stringify({ size: 'huge', theme: 'food' }))
    expect(loadSettings()).toEqual({ size: 'medium', theme: 'food' })
    localStorage.setItem('memory-match:settings', '[1]')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })
})

describe('best records', () => {
  it('round-trips', () => {
    saveBest({ small: { moves: 7, time: 12_000 }, large: { moves: 30, time: 90_000 } })
    expect(loadBest()).toEqual({ small: { moves: 7, time: 12_000 }, large: { moves: 30, time: 90_000 } })
  })

  it('skips unknown sizes and invalid records', () => {
    localStorage.setItem(
      'memory-match:best',
      JSON.stringify({ small: { moves: 7, time: 1000 }, medium: { moves: -1, time: 5 }, large: 'x', huge: { moves: 1, time: 1 } }),
    )
    expect(loadBest()).toEqual({ small: { moves: 7, time: 1000 } })
    localStorage.setItem('memory-match:best', 'nope')
    expect(loadBest()).toEqual({})
  })

  it('survives storage that throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full')
    })
    expect(() => saveBest({})).not.toThrow()
    vi.restoreAllMocks()
  })
})
