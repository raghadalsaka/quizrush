export type AnswerOptions = [string, string, string, string]

export interface Question {
  id: string
  prompt: string
  options: AnswerOptions
  correctIndex: number
  explanation: string
}

export interface ContestSettings {
  secondsPerQuestion: number
  defaultQuestionsPerTeam: number
  allowCrossTeamRepeats: boolean
}

export interface Contest {
  title: string
  category: string
  slug: string
  settings: ContestSettings
  questions: Question[]
}

export interface CatalogEntry {
  slug: string
  title: string
  category: string
  file: string
}

export interface CatalogGroup {
  category: string
  entries: CatalogEntry[]
}

export type ContestLoadResult = { ok: true; contest: Contest } | { ok: false; errors: string[] }
