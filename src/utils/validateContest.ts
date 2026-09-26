import { MAX_QUESTIONS_PER_TEAM, MAX_SECONDS_PER_QUESTION, OPTION_COUNT } from '../config'
import type { AnswerOptions, Contest, ContestLoadResult, ContestSettings, Question } from '../types/contest'
import { isIntegerInRange } from './numbers'

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function validateSettings(value: unknown, errors: string[]): ContestSettings | null {
  if (!isObject(value)) {
    errors.push('settings must be an object with secondsPerQuestion, defaultQuestionsPerTeam and allowCrossTeamRepeats.')
    return null
  }
  const errorCountBefore = errors.length
  if (!isIntegerInRange(value.secondsPerQuestion, 1, MAX_SECONDS_PER_QUESTION)) {
    errors.push(`settings.secondsPerQuestion must be a whole number from 1 to ${MAX_SECONDS_PER_QUESTION}.`)
  }
  if (!isIntegerInRange(value.defaultQuestionsPerTeam, 1, MAX_QUESTIONS_PER_TEAM)) {
    errors.push(`settings.defaultQuestionsPerTeam must be a whole number from 1 to ${MAX_QUESTIONS_PER_TEAM}.`)
  }
  if (typeof value.allowCrossTeamRepeats !== 'boolean') {
    errors.push('settings.allowCrossTeamRepeats must be true or false (without quotes).')
  }
  if (errors.length > errorCountBefore) {
    return null
  }
  return {
    secondsPerQuestion: value.secondsPerQuestion as number,
    defaultQuestionsPerTeam: value.defaultQuestionsPerTeam as number,
    allowCrossTeamRepeats: value.allowCrossTeamRepeats as boolean,
  }
}

function validateQuestion(value: unknown, path: string, seenIds: Set<string>, errors: string[]): Question | null {
  if (!isObject(value)) {
    errors.push(`${path} must be an object.`)
    return null
  }
  const errorCountBefore = errors.length
  if (!isNonBlankString(value.id)) {
    errors.push(`${path}.id must be a non-blank string.`)
  } else if (seenIds.has(value.id.trim())) {
    errors.push(`${path}.id "${value.id.trim()}" is used by an earlier question; ids must be unique.`)
  } else {
    seenIds.add(value.id.trim())
  }
  if (!isNonBlankString(value.prompt)) {
    errors.push(`${path}.prompt must be non-blank text.`)
  }
  const options = value.options
  if (!Array.isArray(options) || options.length !== OPTION_COUNT) {
    errors.push(`${path}.options must be a list of exactly ${OPTION_COUNT} answers.`)
  } else {
    options.forEach((option, index) => {
      if (!isNonBlankString(option)) {
        errors.push(`${path}.options[${index}] must be non-blank text.`)
      }
    })
  }
  if (!isIntegerInRange(value.correctIndex, 0, OPTION_COUNT - 1)) {
    errors.push(`${path}.correctIndex must be a whole number from 0 to ${OPTION_COUNT - 1}.`)
  }
  if (!isNonBlankString(value.explanation)) {
    errors.push(`${path}.explanation must be non-blank text.`)
  }
  if (errors.length > errorCountBefore) {
    return null
  }
  return {
    id: (value.id as string).trim(),
    prompt: (value.prompt as string).trim(),
    options: (options as string[]).map((option) => option.trim()) as AnswerOptions,
    correctIndex: value.correctIndex as number,
    explanation: (value.explanation as string).trim(),
  }
}

export function validateContest(data: unknown): ContestLoadResult {
  if (!isObject(data)) {
    return { ok: false, errors: ['The file must contain one JSON object with title, settings and questions.'] }
  }
  const errors: string[] = []
  if (!isNonBlankString(data.title)) {
    errors.push('title must be non-blank text.')
  }
  const settings = validateSettings(data.settings, errors)
  const questions: Question[] = []
  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    errors.push('questions must be a non-empty list.')
  } else {
    const seenIds = new Set<string>()
    data.questions.forEach((value, index) => {
      const question = validateQuestion(value, `questions[${index}]`, seenIds, errors)
      if (question !== null) {
        questions.push(question)
      }
    })
  }
  if (errors.length > 0 || settings === null) {
    return { ok: false, errors }
  }
  const contest: Contest = { title: (data.title as string).trim(), settings, questions }
  return { ok: true, contest }
}
