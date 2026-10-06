import { flip, hideMismatch, newGame, type Game, type Size } from './game'
import type { Theme } from './themes'

export interface Settings {
  size: Size
  theme: Theme
}

/** Best results per board size; fewest moves and fastest time are tracked separately. */
export interface BestRecord {
  moves: number
  time: number
}
export type BestRecords = Partial<{ [size in Size]: BestRecord }>

export interface Session {
  settings: Settings
  game: Game
  best: BestRecords
  /** Which records the game just won set. */
  newBest: { moves: boolean; time: boolean }
}

export type Action =
  | { type: 'flip'; index: number; now: number }
  | { type: 'hide' }
  | { type: 'restart'; random: () => number }
  | { type: 'settings'; settings: Partial<Settings>; random: () => number }

const NO_BEST = { moves: false, time: false }

export function newSession(settings: Settings, best: BestRecords, random: () => number): Session {
  return { settings, best, game: newGame(settings.size, settings.theme, random), newBest: NO_BEST }
}

export function sessionReducer(session: Session, action: Action): Session {
  switch (action.type) {
    case 'flip': {
      const game = flip(session.game, action.index, action.now)
      if (game === session.game) return session
      if (game.finishedAt === null || game.startedAt === null) return { ...session, game }
      return { ...session, game, ...recordWin(session.best, game.size, game.moves, game.finishedAt - game.startedAt) }
    }
    case 'hide':
      return { ...session, game: hideMismatch(session.game) }
    case 'restart':
      return newSession(session.settings, session.best, action.random)
    case 'settings':
      return newSession({ ...session.settings, ...action.settings }, session.best, action.random)
  }
}

function recordWin(best: BestRecords, size: Size, moves: number, time: number) {
  const old = best[size]
  const newBest = { moves: !old || moves < old.moves, time: !old || time < old.time }
  const record = { moves: newBest.moves ? moves : old!.moves, time: newBest.time ? time : old!.time }
  return { best: { ...best, [size]: record }, newBest }
}
