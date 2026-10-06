import { describe, expect, it } from 'vitest'
import { elapsed, flip, formatTime, hideMismatch, matchedPairs, newGame, pairCount, shuffle, status, type Game } from './game'
import { THEMES } from './themes'

const zero = () => 0
/** Indexes of both cards of every pair, in pair order. */
const pairsOf = (game: Game) =>
  Array.from({ length: pairCount(game.size) }, (_, pair) =>
    game.cards.flatMap((c, i) => (c.pair === pair ? [i] : [])),
  )
/** One card from each of two different pairs. */
const mismatchOf = (game: Game) => [pairsOf(game)[0][0], pairsOf(game)[1][0]] as const

describe('dealing', () => {
  it('deals two of each face for the board size', () => {
    for (const [size, cards] of [['small', 12], ['medium', 16], ['large', 36]] as const) {
      const game = newGame(size, 'animals', Math.random)
      expect(game.cards).toHaveLength(cards)
      const counts = new Map<string, number>()
      for (const c of game.cards) counts.set(c.face, (counts.get(c.face) ?? 0) + 1)
      expect(counts.size).toBe(cards / 2)
      expect([...counts.values()].every((n) => n === 2)).toBe(true)
    }
  })

  it('draws faces from the chosen theme', () => {
    const faces = new Set<string>(THEMES.food.cards.map(([face]) => face))
    expect(newGame('large', 'food', Math.random).cards.every((c) => faces.has(c.face))).toBe(true)
  })

  it('every theme has enough faces for the largest board', () => {
    for (const theme of Object.values(THEMES)) {
      expect(new Set(theme.cards.map(([f]) => f)).size).toBeGreaterThanOrEqual(pairCount('large'))
    }
  })

  it('shuffles predictably with a given random source and keeps every item', () => {
    expect(shuffle([1, 2, 3, 4], zero)).toEqual([2, 3, 4, 1])
    expect(shuffle([1, 2, 3, 4], Math.random).sort()).toEqual([1, 2, 3, 4])
  })

  it('starts ready, face down, with no moves', () => {
    const game = newGame('medium', 'animals', zero)
    expect(status(game)).toBe('ready')
    expect(game.open).toEqual([])
    expect(game.matched.some(Boolean)).toBe(false)
    expect(game.moves).toBe(0)
  })
})

describe('flipping', () => {
  it('starts the clock on the first flip', () => {
    const game = flip(newGame('small', 'animals', zero), 0, 1000)
    expect(status(game)).toBe('playing')
    expect(game.open).toEqual([0])
    expect(game.moves).toBe(0)
    expect(elapsed(game, 4500)).toBe(3500)
  })

  it('keeps a matching pair face up and counts a move', () => {
    const start = newGame('small', 'animals', zero)
    const [a, b] = pairsOf(start)[0]
    const game = flip(flip(start, a, 0), b, 10)
    expect(game.matched[a] && game.matched[b]).toBe(true)
    expect(game.open).toEqual([])
    expect(game.moves).toBe(1)
    expect(matchedPairs(game)).toBe(1)
  })

  it('leaves a mismatch showing until hidden', () => {
    const start = newGame('small', 'animals', zero)
    const [a, b] = mismatchOf(start)
    const game = flip(flip(start, a, 0), b, 10)
    expect(game.open).toEqual([a, b])
    expect(game.moves).toBe(1)
    expect(game.matched.some(Boolean)).toBe(false)
    expect(hideMismatch(game).open).toEqual([])
  })

  it('turning a third card hides the mismatch at once', () => {
    const start = newGame('small', 'animals', zero)
    const [a, b] = mismatchOf(start)
    const c = pairsOf(start)[2][0]
    const game = flip(flip(flip(start, a, 0), b, 10), c, 20)
    expect(game.open).toEqual([c])
    expect(game.moves).toBe(1)
  })

  it('ignores the same card twice, matched cards and missing cards', () => {
    const start = newGame('small', 'animals', zero)
    const [a, b] = pairsOf(start)[0]
    const once = flip(start, a, 0)
    expect(flip(once, a, 5)).toBe(once)
    const matched = flip(once, b, 10)
    expect(flip(matched, a, 20)).toBe(matched)
    expect(flip(start, 99, 0)).toBe(start)
  })

  it('wins when the last pair is found and then stops changing', () => {
    let game = newGame('small', 'things', zero)
    pairsOf(game).forEach(([a, b], n) => {
      game = flip(flip(game, a, n * 1000), b, n * 1000 + 500)
    })
    expect(status(game)).toBe('won')
    expect(game.moves).toBe(6)
    expect(game.finishedAt).toBe(5500)
    expect(elapsed(game, 99_999)).toBe(5500)
    expect(flip(game, 0, 6000)).toBe(game)
  })
})

describe('formatTime', () => {
  it('shows minutes and zero-padded seconds', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(9_999)).toBe('0:09')
    expect(formatTime(75_000)).toBe('1:15')
    expect(formatTime(600_000)).toBe('10:00')
  })
})
