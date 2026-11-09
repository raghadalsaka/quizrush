export type Phase = 'loading' | 'error' | 'setup' | 'ready' | 'revealing' | 'answering' | 'paused' | 'resolved' | 'results'

export type OutcomeKind = 'correct' | 'incorrect' | 'timeout'

export interface Outcome {
  kind: OutcomeKind
  selectedIndex: number | null
}

export type GameMode = 'individual' | 'teams'

export interface RosterEntry {
  name: string
  emoji: string
  photo?: string
}

export interface Team extends RosterEntry {
  score: number
  turnsTaken: number
}

export interface SetupInput {
  mode: GameMode
  roster: readonly RosterEntry[]
  questionsPerTeam: number
  secondsPerQuestion: number
}

export interface ScoreAward {
  teamIndex: number
  awardId: number
}
