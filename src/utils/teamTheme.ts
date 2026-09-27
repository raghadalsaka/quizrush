import { MAX_TEAMS } from '../config'

function teamSlot(teamIndex: number): number {
  return (teamIndex % MAX_TEAMS) + 1
}

export function teamThemeClass(teamIndex: number): string {
  return `team-${teamSlot(teamIndex)}`
}

export function teamColorVar(teamIndex: number): string {
  return `var(--color-t${teamSlot(teamIndex)})`
}
