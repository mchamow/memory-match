import { Sparkles } from 'lucide-react'
import { useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { isMismatch, SIZES, type Game } from './game'

/** Where each key moves focus from card `i`; arrows stop at the edges of the board. */
const MOVES: Record<string, (i: number, cols: number, count: number) => number> = {
  ArrowLeft: (i, cols) => (i % cols === 0 ? i : i - 1),
  ArrowRight: (i, cols, count) => (i % cols === cols - 1 || i === count - 1 ? i : i + 1),
  ArrowUp: (i, cols) => (i < cols ? i : i - cols),
  ArrowDown: (i, cols, count) => (i + cols >= count ? i : i + cols),
  Home: () => 0,
  End: (_, __, count) => count - 1,
}

interface Props {
  game: Game
  onFlip: (index: number) => void
}

/** The cards in a grid; one tab stop, arrow keys move between cards, Enter or Space turns one over. */
export function Board({ game, onFlip }: Props) {
  const { cols } = SIZES[game.size]
  const [focused, setFocused] = useState(0)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const active = Math.min(focused, game.cards.length - 1)
  const mismatch = isMismatch(game)

  const onKeyDown = (event: KeyboardEvent) => {
    const move = MOVES[event.key]
    if (!move || event.ctrlKey || event.metaKey || event.altKey) return
    event.preventDefault()
    const next = move(active, cols, game.cards.length)
    setFocused(next)
    buttons.current[next]?.focus()
  }

  return (
    <div
      role="group"
      aria-label="Cards"
      onKeyDown={onKeyDown}
      className={cn('mx-auto grid w-full gap-2 sm:gap-3', cols > 4 ? 'max-w-xl' : 'max-w-md')}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {game.cards.map((card, i) => {
        const matched = game.matched[i]
        const open = game.open.includes(i)
        const up = matched || open
        const where = `Row ${Math.floor(i / cols) + 1}, column ${(i % cols) + 1}`
        return (
          <button
            key={i}
            ref={(el) => {
              buttons.current[i] = el
            }}
            type="button"
            tabIndex={i === active ? 0 : -1}
            aria-label={`${where}, ${matched ? `${card.name}, matched` : open ? card.name : 'face down'}`}
            aria-disabled={matched || open || undefined}
            onFocus={() => setFocused(i)}
            onClick={() => onFlip(i)}
            className="group @container aspect-square rounded-xl outline-none perspective-[800px] focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div
              className={cn(
                'relative size-full transition-transform duration-300 ease-out transform-3d motion-reduce:transition-none',
                up && 'rotate-y-180',
              )}
            >
              <div
                aria-hidden
                className="absolute inset-0 grid place-items-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-sm ring-1 ring-white/20 ring-inset backface-hidden transition group-hover:brightness-110 group-active:scale-95 dark:from-indigo-600 dark:to-violet-800"
              >
                <Sparkles className="size-[32cqw] opacity-70" />
              </div>
              <div
                aria-hidden
                className={cn(
                  'absolute inset-0 grid rotate-y-180 place-items-center rounded-xl border bg-card text-[50cqw] leading-none shadow-sm backface-hidden select-none',
                  matched && 'border-emerald-500/60 bg-emerald-50 dark:border-emerald-400/50 dark:bg-emerald-950/60',
                  open && mismatch && 'border-destructive/70 bg-destructive/10',
                )}
              >
                <span className={cn(matched && 'opacity-80')}>{card.face}</span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
