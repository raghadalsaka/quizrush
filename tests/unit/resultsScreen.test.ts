import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AvatarBadge from '../../src/components/AvatarBadge.vue'
import ResultsScreen from '../../src/components/ResultsScreen.vue'
import { rankTeams } from '../../src/utils/ranking'

const PHOTO: string = 'data:image/jpeg;base64,QUJD'

describe('ResultsScreen', () => {
  it('shows each player photo on the podium and in the list, and the emoji where there is none', () => {
    const players = Array.from({ length: 6 }, (_, index) => ({
      name: `Player ${index + 1}`,
      emoji: '🦊',
      score: 6 - index,
      ...(index % 2 === 0 ? { photo: PHOTO } : {}),
    }))
    const wrapper = mount(ResultsScreen, { props: { rankedTeams: rankTeams(players), questionsPerTeam: 6, mode: 'individual' } })

    const badges = wrapper.findAllComponents(AvatarBadge)
    expect(badges).toHaveLength(6)
    expect(badges.map((badge) => badge.find('img').exists())).toEqual([true, false, true, false, true, false])
    expect(badges[0]!.get('img').attributes('src')).toBe(PHOTO)
    expect(badges[1]!.text()).toBe('🦊')
  })
})
