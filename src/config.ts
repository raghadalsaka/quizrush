import type { GameMode } from './types/game.ts'

export const OPTION_COUNT: number = 4
export const MIN_TEAMS: number = 1
export const MAX_TEAMS: number = 5
export const MAX_QUESTIONS_PER_TEAM: number = 50
export const MAX_SECONDS_PER_QUESTION: number = 600
export const MAX_TEAM_NAME_LENGTH: number = 30
export const MIN_PLAYERS: number = 1
export const MAX_PLAYERS: number = 30
export const DEFAULT_QUESTIONS_PER_PLAYER: number = 1
export const DEFAULT_GAME_MODE: GameMode = 'individual'
export const TEAM_PALETTE_SIZE: number = 5
export const ROOMY_LAYOUT_LIMIT: number = 5
export const MAX_NAMED_WINNERS: number = 5
export const FLIP_OUT_MS: number = 220
export const FLIP_IN_MS: number = 320
export const REVEAL_SETTLE_MS: number = 60
export const REVEAL_MS: number = FLIP_OUT_MS + FLIP_IN_MS + REVEAL_SETTLE_MS
export const TICK_MS: number = 200
export const LOW_TIME_MS: number = 10_000
export const OPTION_LABELS: readonly string[] = ['A', 'B', 'C', 'D']
// Prompts carrying a list or passage are set smaller so less of the card needs scrolling.
export const LONG_PROMPT_LENGTH: number = 160
export const CONTESTS_DIR: string = 'contests'

export interface ModeWords {
  label: string
  noun: string
  nounPlural: string
  title: string
}

export const MODE_WORDS: Readonly<Record<GameMode, ModeWords>> = {
  individual: { label: 'Individual Players', noun: 'player', nounPlural: 'players', title: 'Player' },
  teams: { label: 'Teams', noun: 'team', nounPlural: 'teams', title: 'Team' },
}

// Same pool as QuestRush, so a student keeps the same kind of pawn in both games.
export const EMOJI_POOL: readonly string[] = [
  '🦊', '🐼', '🐯', '🦁', '🐸', '🐙', '🦉', '🐢', '🐬', '🦄', '🐝', '🦋', '🐧', '🐨', '🦒', '🐘', '🦓', '🐳', '🦜', '🐞',
  '🦀', '🦔', '🐻', '🐰', '🐮', '🐷', '🐵', '🦩', '🦦', '🦥', '🐿️', '🦭', '🐊', '🦚', '🐌', '🦕', '🦖', '🐠', '🦅', '🐺',
]
