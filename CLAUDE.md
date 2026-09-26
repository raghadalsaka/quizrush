# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Quizrush is a single-device, projector-friendly classroom quiz: 1–5 teams take equal round-robin turns on multiple-choice questions loaded from `public/contest.json`. It runs entirely in the browser (Vue 3 + TypeScript + Vite + Tailwind 4) and is served by GitHub Pages at https://quizrush.raghadalsaka.com.

## Commands

Node 22.12 or newer (`.nvmrc`).

```sh
npm run dev          # Vite dev server
npm run check        # type-check + lint + tests (run before handing work back)
npm run build        # vue-tsc -b && vite build -> dist/
npm run preview      # serve dist/ at http://localhost:4173
npm run lint:fix
npx vitest run tests/unit/deck.test.ts              # one test file
npx vitest run -t "replaced card goes to another"   # tests by name
```

- To check a subpath build locally: `VITE_BASE=/quizrush/ npm run build`.
- On Git Bash for Windows, prefix commands like that with `MSYS_NO_PATHCONV=1`. Without it, `/quizrush/` (and `rev:path` arguments to `git show`) are rewritten into Windows paths.
- **Don't run browser end-to-end checks unless the user explicitly asks.** This means Playwright driving a browser against `npm run preview` or the live site. They are slow, so ask before running one. `npm run check` plus `npm run build` is the default verification.

## Architecture

**One screen, no router or store.** `App.vue` creates the single `useGame()` instance and picks the screen from `phase`. `GameScreen` receives the game through `provide`/`inject` (`gameKey`, `injectGame()`), because it needs most of the state. The other screens and the leaf components get props.

**Layers.**
- `src/utils/`: framework-free logic (validation, setup rules, deck, ranking, randomness), fully unit-tested.
- `src/composables/`: the Vue glue. `useGame` owns all state and timers; `useCountdown` is the timer.
- `src/config.ts`: every tunable (limits, timings, labels). Import from there instead of repeating numbers.

**Game state machine (`useGame.ts`).**
- Phases: `loading → error | setup → ready → revealing → answering → resolved → ready | results → setup`.
- Every action first checks the current phase, so double clicks and actions in the wrong phase do nothing.
- Every draw increments `cardId`. Reveal timers and confirmation dialogs capture the `cardId` they were started for, and are ignored once it changes.
- `answer` and `replaceCard` check `countdown.isExpired()`, so an action that arrives after the deadline, but before the next timer tick, becomes a timeout.
- Scoring happens in exactly one place (`resolve`), guarded by the `answering` phase, so a turn can award at most one point.

**Timer (`useCountdown.ts`).** The timer counts down to a fixed deadline measured with `performance.now()`, never by counting interval ticks. A `visibilitychange` listener re-checks it when the tab returns, so a suspended tab gets no extra time. `isExpired()` is checked at answer time. The countdown only starts once the card flip has finished.

**Card reveal timing.**
- `REVEAL_MS` is derived from `FLIP_OUT_MS + FLIP_IN_MS + REVEAL_SETTLE_MS` in `config.ts`.
- `QuestionCard` passes the flip durations to CSS as the variables `--flip-out-ms` and `--flip-in-ms`. Change the timings in `config.ts`, not in `main.css`.
- Reduced motion is handled twice: by the CSS media query, and by `defaultRevealMs()`, which returns 0 so the timer starts immediately.
- The leaving card is made `inert` in `@before-leave`.

**Question selection (`src/utils/deck.ts`).** This is the subtle part.
- Two sets are tracked:
  - `exposedBy[team]`: filled when a card is revealed, including cards that are later replaced. A team never sees a question twice.
  - `consumed`: repeats-off mode only, filled when a question is answered or times out. A replaced card therefore goes back into the deck for other teams only.
- `safeCandidates` only offers questions for which every remaining turn of every team can still be filled. It checks this with Hall's condition over team subsets (≤ 31 of them). This filter runs on every draw, not only on Different Card. Without it, an ordinary random draw can leave a later team with no question after replacements. The randomized test in `deck.test.ts` catches that.
- The deck is a plain object inside `useGame`, not reactive state. `canReplace` is recomputed when a card becomes answerable.

**Contest loading.**
- `src/services/contestService.ts` fetches `${import.meta.env.BASE_URL}contest.json` with `cache: 'no-cache'`, so edits aren't hidden behind a CDN or browser cache.
- `validateContest` checks the structure. On any failure the app shows a plain "try again" screen and logs the details with `console.error`; there is no fallback data.
- The UI is for teachers and students, so keep user-visible text free of technical terms (file names, JSON, HTTP codes). Technical details belong in the console or the README.
- Setup capacity (`setupRules.ts`): repeats off needs `teams × questionsPerTeam` questions; repeats on needs `questionsPerTeam`.

**Tests (`tests/unit/`).** `helpers.ts` provides:
- `seededRandomInt` and `pickFirst`: deterministic randomness, injected through `useGame({ randomInt })`.
- `useFakeClock()`: fake timers plus a mocked `performance.now`. `advance(ms)` moves the clock and runs timers; `jump(ms)` moves the clock only, to simulate a suspended tab or a zero-crossing race.
- `runInScope`: runs a composable inside an effect scope so its cleanup can be tested.
- `makeContest`: builds test contests.

## Constraints

- No backend, accounts, persistence (not even localStorage), external data services or animation libraries. Media assets (images, audio, video) are allowed; put them in `public/` or import them from `src/`.
- Reloading the page starts a fresh game.
- `public/favicon.png` is a 180×180 render of `public/favicon.svg` with square corners, because iOS fills transparent corners with black. Re-render it whenever the SVG changes (for example with `sharp`, run from outside the project so it doesn't become a dependency).
- The correct answer must not appear in the DOM or in styling before the question is resolved.
- TypeScript is pinned to `~6.0`, because `typescript-eslint` 8.x requires `typescript <6.1.0`. Check that before bumping.
- The top-tied teams are all celebrated, even when the top score is 0.

## Content and deployment

- `public/contest.json` is written by the repo owner and uses CRLF line endings. The validator can't tell whether an answer key is right. When the file changes, check that each question has exactly one correct option, and report ambiguous distractors rather than editing them unasked.
- `.github/workflows/deploy.yml` runs on pushes to `main` and on manual dispatch. It type-checks, lints, tests, builds with base `/` (the site lives at the domain root) and deploys `dist/`.
- The `github-pages` environment only allows `main` to deploy. There are no PR checks.
- The GitHub Pages custom domain and Cloudflare DNS (a CNAME that isn't proxied) are managed by hand in their web UIs. Don't automate or change them.
