import { ROOMY_LAYOUT_LIMIT, TEAM_PALETTE_SIZE } from '../config'

export type Density = 'roomy' | 'crowded'

function teamSlot(teamIndex: number): number {
  return (teamIndex % TEAM_PALETTE_SIZE) + 1
}

export function densityFor(entryCount: number): Density {
  return entryCount > ROOMY_LAYOUT_LIMIT ? 'crowded' : 'roomy'
}

export function teamThemeClass(teamIndex: number): string {
  return `team-${teamSlot(teamIndex)}`
}

export function teamColorVar(teamIndex: number): string {
  return `var(--color-t${teamSlot(teamIndex)})`
}
