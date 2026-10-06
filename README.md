# 🃏 Memory Match

[![Test and deploy](https://github.com/mchamow/memory-match/actions/workflows/deploy.yml/badge.svg)](https://github.com/mchamow/memory-match/actions/workflows/deploy.yml)

**Day 19 of [100 Days of React](https://github.com/mchamow?tab=repositories)**: Flip cards and find every emoji pair in as few moves as you can.

**Live demo:** https://mchamow.github.io/memory-match/

## Features

- **Three board sizes**: small 4×3 (6 pairs), medium 4×4 (8 pairs) and large 6×6 (18 pairs)
- **Three card themes**: animals, food and things, with faces drawn at random from each set
- **3D card flips** done with CSS transforms (no animation library), switched off for people who prefer reduced motion
- A mismatched pair turns red and stays up long enough to memorise, then flips back. Turning a third card hides it straight away, so fast players don't have to wait
- **Moves, pairs found and a timer** that starts on the first flip and stops on the last match
- **Best results for each board size**: fewest moves and fastest time are tracked separately, and the win summary shows which records you just set
- **Keyboard play**: the board is a single tab stop. Arrow keys move between cards, <kbd>Home</kbd>/<kbd>End</kbd> jump to the first and last card, <kbd>Enter</kbd> or <kbd>Space</kbd> flips, and <kbd>R</kbd> starts a new game
- Every card has an accessible name (its position, then "face down", the emoji's name, or "matched"), and screen readers hear mismatches and the win announced
- Settings and records are saved to `localStorage`; corrupt or invalid saved data falls back to the defaults
- Light and dark themes that follow the system, and a layout that works on a 360px phone (even the 6×6 board)

## Tech

React 19 · TypeScript · Vite · Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (Base UI) · lucide icons · Vitest + Testing Library · deployed to GitHub Pages with GitHub Actions.

The rules live in [`src/game.ts`](src/game.ts) as pure functions (`newGame`, `flip`, `hideMismatch`). [`src/session.ts`](src/session.ts) wraps them in a reducer that also handles settings and records. The random source and the current time are passed in through actions, so tests can predict the deal exactly. The app adds two effects on top: a timeout that turns a mismatch back over, and an interval that ticks the clock while a game is in progress.

## Run locally

```bash
pnpm install
pnpm dev
pnpm test   # 40 unit and component tests (Vitest)
```
