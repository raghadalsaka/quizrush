import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import HomeScreen from '../../src/components/HomeScreen.vue'

describe('HomeScreen', () => {
  it('shows each quiz link under its category heading', () => {
    const wrapper = mount(HomeScreen, {
      props: {
        entries: [
          { slug: 'apples', title: 'Apples', category: 'Other Quizzes', file: 'apples.json' },
          { slug: 'tenses', title: 'Tenses', category: 'Midterm', file: 'tenses.json' },
        ],
      },
    })
    const sections = wrapper.findAll('nav section')
    expect(sections.map((section) => section.get('h2').text())).toEqual(['Midterm', 'Other Quizzes'])
    expect(sections.map((section) => section.findAll('a').map((link) => link.text()))).toEqual([['Tenses'], ['Apples']])
    expect(sections[0]?.get('a').attributes('href')).toMatch(/\/tenses\/$/)
  })
})
