export type Phase = 'loading' | 'error' | 'setup' | 'ready' | 'revealing' | 'answering' | 'resolved' | 'results'

export type OutcomeKind = 'correct' | 'incorrect' | 'timeout'

export interface Outcome {
  kind: OutcomeKind
  selectedIndex: number | null
}

export interface Team {
  name: string
  score: number
  turnsTaken: number
}

export interface SetupInput {
  teamNames: readonly string[]
  questionsPerTeam: number
  secondsPerQuestion: number
}

export interface ScoreAward {
  teamIndex: number
  awardId: number
}
