import { Clock, Footprints, RotateCcw, Trophy } from 'lucide-react'
import { useEffect, useReducer, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Board } from './Board'
import {
  elapsed,
  formatTime,
  isMismatch,
  matchedPairs,
  MISMATCH_MS,
  pairCount,
  SIZE_NAMES,
  SIZES,
  status,
  type Game,
  type Size,
} from './game'
import { newSession, sessionReducer } from './session'
import { loadBest, loadSettings, saveBest, saveSettings } from './store'
import { THEME_NAMES, THEMES, type Theme } from './themes'

const SIZE_LABELS: Record<Size, string> = { small: 'Small', medium: 'Medium', large: 'Large' }

export default function App() {
  const [{ game, settings, best, newBest }, dispatch] = useReducer(sessionReducer, null, () =>
    newSession(loadSettings(), loadBest(), Math.random),
  )
  const [now, setNow] = useState(Date.now)
  const [dismissed, setDismissed] = useState<Game | null>(null)
  const state = status(game)
  const pairs = pairCount(game.size)
  const found = matchedPairs(game)
  const record = best[game.size]

  useEffect(() => saveSettings(settings), [settings])
  useEffect(() => saveBest(best), [best])

  useEffect(() => {
    if (state !== 'playing') return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [state])

  // A mismatched pair stays up long enough to memorise, then turns back over.
  useEffect(() => {
    if (!isMismatch(game)) return
    const id = setTimeout(() => dispatch({ type: 'hide' }), MISMATCH_MS)
    return () => clearTimeout(id)
  }, [game])

  const flip = (index: number) => {
    const time = Date.now()
    setNow(time)
    dispatch({ type: 'flip', index, now: time })
  }
  const restart = () => dispatch({ type: 'restart', random: Math.random })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.key.toLowerCase() !== 'r') return
      dispatch({ type: 'restart', random: Math.random })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const time = formatTime(Math.max(0, elapsed(game, now)))
  const [a, b] = game.open
  const announcement =
    state === 'won'
      ? `All ${pairs} pairs found in ${game.moves} moves and ${time}.`
      : isMismatch(game)
        ? `No match: ${game.cards[a].name} and ${game.cards[b].name}.`
        : ''

  return (
    <TooltipProvider>
      <main className="mx-auto flex min-h-svh max-w-2xl flex-col gap-5 px-4 py-6 sm:py-8">
        <header className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            <span aria-hidden>🃏 </span>Memory Match
          </h1>
          <Tooltip>
            <TooltipTrigger
              render={<Button variant="outline" size="icon" aria-label="New game" onClick={restart} />}
            >
              <RotateCcw />
            </TooltipTrigger>
            <TooltipContent>
              New game <Kbd>R</Kbd>
            </TooltipContent>
          </Tooltip>
        </header>

        <section aria-label="Stats" className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="secondary" className="gap-1 tabular-nums" aria-label={`Moves ${game.moves}`}>
            <Footprints />
            {game.moves} {game.moves === 1 ? 'move' : 'moves'}
          </Badge>
          <Badge variant="secondary" className="tabular-nums" aria-label={`Pairs ${found} of ${pairs}`}>
            {found}/{pairs} pairs
          </Badge>
          <Badge variant="secondary" className="gap-1 tabular-nums" aria-label={`Time ${time}`}>
            <Clock />
            {time}
          </Badge>
          <Badge
            variant="outline"
            className="gap-1 tabular-nums"
            aria-label={record ? `Best ${record.moves} moves, ${formatTime(record.time)}` : 'No best yet'}
          >
            <Trophy />
            {record ? `${record.moves} · ${formatTime(record.time)}` : '—'}
          </Badge>
        </section>

        <Board key={game.cards.map((c) => c.face).join()} game={game} onFlip={flip} />
        <p role="status" className="sr-only">
          {announcement}
        </p>

        <section
          aria-label="Settings"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
        >
          <ToggleGroup
            aria-label="Board size"
            variant="outline"
            value={[settings.size]}
            onValueChange={([size]) => size && dispatch({ type: 'settings', settings: { size: size as Size }, random: Math.random })}
          >
            {SIZE_NAMES.map((size) => (
              <ToggleGroupItem key={size} value={size} aria-label={`${SIZE_LABELS[size]}, ${pairCount(size)} pairs`}>
                {SIZE_LABELS[size]}
                <span className="text-muted-foreground tabular-nums">
                  {SIZES[size].cols}×{SIZES[size].rows}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ToggleGroup
            aria-label="Theme"
            variant="outline"
            value={[settings.theme]}
            onValueChange={([theme]) =>
              theme && dispatch({ type: 'settings', settings: { theme: theme as Theme }, random: Math.random })
            }
          >
            {THEME_NAMES.map((theme) => (
              <ToggleGroupItem key={theme} value={theme}>
                <span aria-hidden>{THEMES[theme].cards[0][0]}</span>
                {THEMES[theme].label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </section>
        {state === 'playing' && (
          <p className="-mt-2 text-center text-xs text-muted-foreground">Changing a setting starts a new game.</p>
        )}

        <footer className="mt-auto text-center text-xs text-muted-foreground max-sm:hidden">
          <Kbd>←</Kbd> <Kbd>↑</Kbd> <Kbd>→</Kbd> <Kbd>↓</Kbd> move · <Kbd>Enter</Kbd> or <Kbd>Space</Kbd> flip ·{' '}
          <Kbd>R</Kbd> new game
        </footer>
      </main>

      <Dialog open={state === 'won' && dismissed !== game} onOpenChange={(open) => !open && setDismissed(game)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <span aria-hidden>🎉 </span>All pairs found!
            </DialogTitle>
            <DialogDescription>
              {pairs} pairs in {game.moves} moves and {time}.
            </DialogDescription>
          </DialogHeader>
          {(newBest.moves || newBest.time) && (
            <div className="flex flex-wrap gap-2">
              {newBest.moves && (
                <Badge className="gap-1">
                  <Trophy />
                  Fewest moves
                </Badge>
              )}
              {newBest.time && (
                <Badge className="gap-1">
                  <Trophy />
                  Fastest time
                </Badge>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={restart} autoFocus>
              <RotateCcw data-icon="inline-start" />
              Play again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
