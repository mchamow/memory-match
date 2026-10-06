import { THEMES, type Theme } from './themes'

export const SIZES = {
  small: { cols: 4, rows: 3 },
  medium: { cols: 4, rows: 4 },
  large: { cols: 6, rows: 6 },
} as const
export type Size = keyof typeof SIZES
export const SIZE_NAMES = Object.keys(SIZES) as Size[]

/** How long a mismatched pair stays face up before turning back over. */
export const MISMATCH_MS = 900

export interface Card {
  /** Both cards of a pair share it. */
  pair: number
  face: string
  name: string
}

export interface Game {
  size: Size
  cards: Card[]
  /** Face-up cards that aren't matched yet: none, one, or a mismatched pair waiting to turn back. */
  open: number[]
  matched: boolean[]
  /** One move per pair of cards turned over. */
  moves: number
  startedAt: number | null
  finishedAt: number | null
}

export type Status = 'ready' | 'playing' | 'won'

export const pairCount = (size: Size) => (SIZES[size].cols * SIZES[size].rows) / 2

/** Fisher–Yates with an injectable random source, so tests can predict the deal. */
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function newGame(size: Size, theme: Theme, random: () => number): Game {
  const faces = shuffle(THEMES[theme].cards, random).slice(0, pairCount(size))
  const deck = faces.flatMap(([face, name], pair) => [
    { pair, face, name },
    { pair, face, name },
  ])
  const cards = shuffle(deck, random)
  return { size, cards, open: [], matched: cards.map(() => false), moves: 0, startedAt: null, finishedAt: null }
}

export const status = (game: Game): Status =>
  game.finishedAt !== null ? 'won' : game.startedAt !== null ? 'playing' : 'ready'

export const isMismatch = (game: Game) => game.open.length === 2

export const matchedPairs = (game: Game) => game.matched.filter(Boolean).length / 2

/** Turn a card face up. Turning a third card while a mismatch is showing hides the mismatch at once. */
export function flip(game: Game, index: number, now: number): Game {
  if (game.finishedAt !== null || game.matched[index] || game.open.includes(index) || !game.cards[index]) return game
  const open = isMismatch(game) ? [index] : [...game.open, index]
  const startedAt = game.startedAt ?? now
  if (open.length < 2) return { ...game, open, startedAt }

  const [a, b] = open
  const moves = game.moves + 1
  if (game.cards[a].pair !== game.cards[b].pair) return { ...game, open, startedAt, moves }

  const matched = game.matched.map((m, i) => m || i === a || i === b)
  const finishedAt = matched.every(Boolean) ? now : null
  return { ...game, open: [], matched, moves, startedAt, finishedAt }
}

/** Turn a showing mismatch back face down. */
export const hideMismatch = (game: Game): Game => (isMismatch(game) ? { ...game, open: [] } : game)

export const elapsed = (game: Game, now: number) =>
  game.startedAt === null ? 0 : (game.finishedAt ?? now) - game.startedAt

export function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
