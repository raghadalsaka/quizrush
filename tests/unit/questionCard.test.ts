import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuestionCard from '../../src/components/QuestionCard.vue'
import { LONG_PROMPT_LENGTH } from '../../src/config'
import { makeQuestion } from './helpers'

function mountWithPrompt(prompt: string) {
  return mount(QuestionCard, {
    props: {
      phase: 'answering',
      question: { ...makeQuestion('q1'), prompt },
      outcome: null,
      cardId: 1,
      teamName: 'Team',
      advanceLabel: 'Next Team',
    },
  })
}

describe('QuestionCard prompt', () => {
  it('keeps line breaks without adding whitespace around the prompt', () => {
    const prompt = 'THE TITLE\nA line of the passage.\n\nWhat happened?'
    const heading = mountWithPrompt(prompt).get('h2')
    expect(heading.classes()).toContain('whitespace-pre-line')
    expect(heading.element.textContent).toBe(prompt)
  })

  it('keeps the large size up to the limit and sets a longer prompt smaller', () => {
    const atLimit = mountWithPrompt('x'.repeat(LONG_PROMPT_LENGTH)).get('h2')
    expect(atLimit.classes()).toContain('text-4xl')
    const overLimit = mountWithPrompt('x'.repeat(LONG_PROMPT_LENGTH + 1)).get('h2')
    expect(overLimit.classes()).toContain('text-xl')
    expect(overLimit.classes()).not.toContain('text-4xl')
  })
})
