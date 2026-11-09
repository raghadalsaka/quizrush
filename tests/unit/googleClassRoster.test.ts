import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AvatarBadge from '../../src/components/AvatarBadge.vue'
import SetupScreen from '../../src/components/SetupScreen.vue'
import { useClassRoster } from '../../src/composables/useClassRoster'
import type { SetupInput } from '../../src/types/game'
import { fakeDeps, makeContest } from './helpers'

async function connectedSetup(classSlug: string) {
  const classRoster = useClassRoster(fakeDeps())
  classRoster.source.value = 'google'
  await classRoster.connect()
  await classRoster.pickClass(classSlug)
  const wrapper = mount(SetupScreen, {
    props: { contest: makeContest(10, false), initial: null, initialByMode: {}, classRoster },
  })
  return { wrapper, classRoster }
}

function rosterColumn(wrapper: Awaited<ReturnType<typeof connectedSetup>>['wrapper']) {
  return wrapper.findAll('fieldset')[1]!
}

describe('Google class roster on the setup screen', () => {
  it('previews the whole class read-only, with no way to edit, pick or reorder students', async () => {
    const { wrapper } = await connectedSetup('6a')
    const column = rosterColumn(wrapper)

    expect(column.findAll('li').map((item) => item.text())).toEqual(['1Lina', '2🐯Sami'])
    expect(column.findAll('textarea')).toHaveLength(0)
    expect(column.findAll('input')).toHaveLength(0)
    expect(column.findAll('button')).toHaveLength(0)
    expect(column.findAll('[draggable="true"]')).toHaveLength(0)
    expect(column.findAll('select').map((select) => select.attributes('id'))).toEqual(['class-choice'])
  })

  it('shows the photo where there is one and the emoji where there is none', async () => {
    const { wrapper } = await connectedSetup('6a')
    const badges = rosterColumn(wrapper).findAllComponents(AvatarBadge)

    expect(badges[0]!.find('img').attributes('src')).toBe('data:image/png;base64,QUJD')
    expect(badges[1]!.find('img').exists()).toBe(false)
    expect(badges[1]!.text()).toBe('🐯')
  })

  it('never draws a photo that is a link rather than a small inline picture', () => {
    const badge = mount(AvatarBadge, { props: { emoji: '🦊', photo: 'https://example.com/lina.jpg', size: 'sm' } })
    expect(badge.find('img').exists()).toBe(false)
    expect(badge.text()).toBe('🦊')
  })

  it('starts the game with exactly the loaded class, photos included', async () => {
    const { wrapper } = await connectedSetup('6a')
    await wrapper.get('form').trigger('submit')

    const started = wrapper.emitted('start')?.[0]?.[0] as SetupInput
    expect(started.mode).toBe('individual')
    expect(started.roster).toEqual([
      { name: 'Lina', emoji: '🦊', photo: 'data:image/png;base64,QUJD' },
      { name: 'Sami', emoji: '🐯' },
    ])
  })

  it('keeps Start Game off until a class is picked', async () => {
    const { wrapper } = await connectedSetup('')
    expect(wrapper.get('#setup-problems').text()).toBe('Connect Google and pick a class.')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('keeps typing names available as its own option', async () => {
    const { wrapper } = await connectedSetup('6a')
    const typeNames = wrapper.findAll('button').find((button) => button.text() === 'Type Names')!
    await typeNames.trigger('click')

    expect(rosterColumn(wrapper).find('textarea#player-names').exists()).toBe(true)
    expect(rosterColumn(wrapper).find('#class-choice').exists()).toBe(false)
  })

  it('offers only typed names when the site was built without Google', () => {
    const wrapper = mount(SetupScreen, {
      props: { contest: makeContest(10, false), initial: null, initialByMode: {}, classRoster: useClassRoster(fakeDeps({ isConfigured: () => false })) },
    })
    expect(wrapper.findAll('button').some((button) => button.text() === 'Google Class')).toBe(false)
    expect(wrapper.find('textarea#player-names').exists()).toBe(true)
  })
})
