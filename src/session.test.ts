import { describe, expect, it } from 'vitest'
import { pairCount } from './game'
import { newSession, sessionReducer, type Action, type Session } from './session'

const zero = () => 0
const start = (best = {}) => newSession({ size: 'small', theme: 'animals' }, best, zero)

/** Find every pair, one move per pair, at 1 s per flip; optionally with extra misses first. */
function play(session: Session, misses = 0): Session {
  const { cards } = session.game
  const pairs = Array.from({ length: pairCount(session.game.size) }, (_, p) =>
    cards.flatMap((c, i) => (c.pair === p ? [i] : [])),
  )
  let t = 0
  const actions: Action[] = []
  for (let m = 0; m < misses; m++) {
    actions.push({ type: 'flip', index: pairs[0][0], now: (t += 1000) })
    actions.push({ type: 'flip', index: pairs[1][0], now: (t += 1000) })
    actions.push({ type: 'hide' })
  }
  for (const [a, b] of pairs) {
    actions.push({ type: 'flip', index: a, now: (t += 1000) })
    actions.push({ type: 'flip', index: b, now: (t += 1000) })
  }
  return actions.reduce(sessionReducer, session)
}

describe('session', () => {
  it('records the first win as the best for its size', () => {
    const won = play(start())
    expect(won.best.small).toEqual({ moves: 6, time: 11_000 })
    expect(won.newBest).toEqual({ moves: true, time: true })
  })

  it('keeps moves and time records separately', () => {
    const won = play(start({ small: { moves: 8, time: 5000 } }))
    expect(won.best.small).toEqual({ moves: 6, time: 5000 })
    expect(won.newBest).toEqual({ moves: true, time: false })
  })

  it('does not replace a better record', () => {
    const won = play(start({ small: { moves: 6, time: 11_000 } }), 2)
    expect(won.game.moves).toBe(8)
    expect(won.best.small).toEqual({ moves: 6, time: 11_000 })
    expect(won.newBest).toEqual({ moves: false, time: false })
  })

  it('restart deals a new game and clears the new-best flags but keeps records', () => {
    const won = play(start())
    const again = sessionReducer(won, { type: 'restart', random: zero })
    expect(again.game.moves).toBe(0)
    expect(again.game.startedAt).toBeNull()
    expect(again.newBest).toEqual({ moves: false, time: false })
    expect(again.best).toBe(won.best)
  })

  it('changing settings deals a game of the new size and theme', () => {
    const s = sessionReducer(start(), { type: 'settings', settings: { size: 'large' }, random: zero })
    expect(s.settings).toEqual({ size: 'large', theme: 'animals' })
    expect(s.game.cards).toHaveLength(36)
    const t = sessionReducer(s, { type: 'settings', settings: { theme: 'food' }, random: zero })
    expect(t.settings).toEqual({ size: 'large', theme: 'food' })
    expect(t.game.cards[0].name).not.toBe(s.game.cards[0].name)
  })

  it('returns the same session for a flip that does nothing', () => {
    const s = sessionReducer(start(), { type: 'flip', index: 0, now: 0 })
    expect(sessionReducer(s, { type: 'flip', index: 0, now: 5 })).toBe(s)
  })
})
