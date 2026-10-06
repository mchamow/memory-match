import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { MISMATCH_MS, newGame, pairCount, type Size } from './game'
import { loadBest, loadSettings, saveBest, saveSettings } from './store'
import type { Theme } from './themes'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  // Deal predictably: the app's deck matches newGame(…, () => 0).
  vi.spyOn(Math, 'random').mockReturnValue(0)
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const cards = () => within(screen.getByRole('group', { name: 'Cards' })).getAllByRole('button')
const label = (i: number) => cards()[i].getAttribute('aria-label')!
const pairsFor = (size: Size = 'medium', theme: Theme = 'animals') => {
  const deck = newGame(size, theme, () => 0).cards
  return Array.from({ length: pairCount(size) }, (_, p) => deck.flatMap((c, i) => (c.pair === p ? [i] : [])))
}
const flip = (i: number) => fireEvent.click(cards()[i])
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms))
const badge = (name: RegExp) => screen.getByLabelText(name).getAttribute('aria-label')
const solve = (pairs: number[][]) =>
  pairs.forEach(([a, b]) => {
    wait(1000)
    flip(a)
    flip(b)
  })

describe('board', () => {
  it('deals a face-down medium board of 16 cards with zeroed stats', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /Memory Match/ })).toBeTruthy()
    expect(cards()).toHaveLength(16)
    expect(cards().every((c) => /face down$/.test(c.getAttribute('aria-label')!))).toBe(true)
    expect(badge(/^Moves/)).toBe('Moves 0')
    expect(badge(/^Pairs/)).toBe('Pairs 0 of 8')
    expect(badge(/^Time/)).toBe('Time 0:00')
    expect(screen.getByLabelText('No best yet')).toBeTruthy()
  })

  it('turns a card over to show its face and starts the clock', () => {
    render(<App />)
    const [[a]] = pairsFor()
    const name = newGame('medium', 'animals', () => 0).cards[a].name
    flip(a)
    expect(label(a)).toMatch(new RegExp(`, ${name}$`))
    wait(3000)
    expect(badge(/^Time/)).toBe('Time 0:03')
  })

  it('keeps a found pair face up and counts it', () => {
    render(<App />)
    const [[a, b]] = pairsFor()
    flip(a)
    flip(b)
    expect(label(a)).toMatch(/, matched$/)
    expect(label(b)).toMatch(/, matched$/)
    expect(badge(/^Moves/)).toBe('Moves 1')
    expect(badge(/^Pairs/)).toBe('Pairs 1 of 8')
    wait(MISMATCH_MS * 2)
    expect(label(a)).toMatch(/, matched$/)
  })

  it('shows a mismatch, announces it, then turns both back', () => {
    render(<App />)
    const [[a], [b]] = pairsFor()
    flip(a)
    flip(b)
    expect(label(a)).not.toMatch(/face down/)
    expect(screen.getByRole('status').textContent).toMatch(/^No match/)
    expect(badge(/^Moves/)).toBe('Moves 1')
    wait(MISMATCH_MS)
    expect(label(a)).toMatch(/face down$/)
    expect(label(b)).toMatch(/face down$/)
  })

  it('a third card hides a showing mismatch right away', () => {
    render(<App />)
    const [[a], [b], [c]] = pairsFor()
    flip(a)
    flip(b)
    flip(c)
    expect(label(a)).toMatch(/face down$/)
    expect(label(b)).toMatch(/face down$/)
    expect(label(c)).not.toMatch(/face down/)
  })
})

describe('winning', () => {
  it('shows a summary with new records, saves them and plays again', () => {
    render(<App />)
    solve(pairsFor())
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('All pairs found!')).toBeTruthy()
    expect(within(dialog).getByText('8 pairs in 8 moves and 0:07.')).toBeTruthy()
    expect(within(dialog).getByText('Fewest moves')).toBeTruthy()
    expect(within(dialog).getByText('Fastest time')).toBeTruthy()
    expect(loadBest()).toEqual({ medium: { moves: 8, time: 7000 } })
    expect(screen.getByLabelText('Best 8 moves, 0:07')).toBeTruthy()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Play again' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(badge(/^Moves/)).toBe('Moves 0')
    expect(screen.getByLabelText('Best 8 moves, 0:07')).toBeTruthy()
  })

  it('the clock stops at the win', () => {
    render(<App />)
    solve(pairsFor())
    wait(10_000)
    expect(badge(/^Time/)).toBe('Time 0:07')
  })

  it('no new-record badges when the old records stand', () => {
    saveBest({ medium: { moves: 8, time: 1000 } })
    render(<App />)
    solve(pairsFor())
    expect(screen.queryByText('Fewest moves')).toBeNull()
    expect(screen.queryByText('Fastest time')).toBeNull()
    expect(loadBest()).toEqual({ medium: { moves: 8, time: 1000 } })
  })

  it('closing the summary leaves the solved board', () => {
    render(<App />)
    solve(pairsFor())
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }))
    act(() => vi.runAllTimers())
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(cards().every((c) => /matched$/.test(c.getAttribute('aria-label')!))).toBe(true)
  })
})

describe('settings', () => {
  it('switches board size and theme, starting a new game, and remembers them', () => {
    render(<App />)
    flip(0)
    fireEvent.click(screen.getByRole('button', { name: 'Large, 18 pairs' }))
    expect(cards()).toHaveLength(36)
    expect(badge(/^Pairs/)).toBe('Pairs 0 of 18')
    expect(badge(/^Time/)).toBe('Time 0:00')

    fireEvent.click(screen.getByRole('button', { name: /Food/ }))
    const [[a]] = pairsFor('large', 'food')
    flip(a)
    expect(label(a)).toContain(newGame('large', 'food', () => 0).cards[a].name)
    expect(loadSettings()).toEqual({ size: 'large', theme: 'food' })
  })

  it('starts with the saved settings', () => {
    saveSettings({ size: 'small', theme: 'things' })
    render(<App />)
    expect(cards()).toHaveLength(12)
    expect(screen.getByRole('button', { name: /Things/ }).getAttribute('aria-pressed')).toBe('true')
  })

  it('keeps records per board size', () => {
    saveBest({ medium: { moves: 10, time: 30_000 } })
    render(<App />)
    expect(screen.getByLabelText('Best 10 moves, 0:30')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Small, 6 pairs' }))
    expect(screen.getByLabelText('No best yet')).toBeTruthy()
  })
})

describe('keyboard', () => {
  it('moves one tab stop between cards with the arrow keys, Home and End', () => {
    render(<App />)
    const tabStops = () => cards().filter((c) => c.tabIndex === 0)
    expect(tabStops()).toEqual([cards()[0]])
    cards()[0].focus()
    fireEvent.keyDown(cards()[0], { key: 'ArrowRight' })
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(cards()[5])
    expect(tabStops()).toEqual([cards()[5]])
    // Arrows stop at the edges instead of wrapping to the next row.
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' })
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(cards()[4])
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' })
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(cards()[0])
    fireEvent.keyDown(document.activeElement!, { key: 'End' })
    expect(document.activeElement).toBe(cards()[15])
  })

  it('R starts a new game', () => {
    render(<App />)
    const [[a, b]] = pairsFor()
    flip(a)
    flip(b)
    fireEvent.keyDown(window, { key: 'r' })
    expect(badge(/^Moves/)).toBe('Moves 0')
    fireEvent.keyDown(window, { key: 'r', metaKey: true })
    expect(badge(/^Moves/)).toBe('Moves 0')
  })

  it('the New game button starts over', () => {
    render(<App />)
    flip(0)
    fireEvent.click(screen.getByRole('button', { name: 'New game' }))
    expect(cards().every((c) => /face down$/.test(c.getAttribute('aria-label')!))).toBe(true)
    expect(badge(/^Time/)).toBe('Time 0:00')
  })
})
