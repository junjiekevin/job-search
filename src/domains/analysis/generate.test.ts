import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateCoverLetter, generateFeedback, generateTailoredResume } from './generate'
import type { Job } from '@/domains/jobs/types'

const ai = vi.hoisted(() => ({ completeJSON: vi.fn() }))

vi.mock('@/lib/ai/client', () => ai)

beforeEach(() => { vi.clearAllMocks() })

const job: Job = {
  id: 'job-1', source: 'manual', title: 'Engineer', company: 'Acme', location: 'New York', description: 'Build reliable systems.', postingUrl: null, applyUrl: null, salaryMin: null, salaryMax: null, salaryCurrency: null, employmentType: 'full-time', postedAt: null,
}

const resumeGeneration = {
  tailoredResume: {
    name: 'Jane Smith',
    contact: 'jane@example.com',
    summary: 'Experienced engineer.',
    experience: [{ role: 'Engineer', company: 'Acme', bullets: ['Built scalable systems'] }],
  },
}

const coverLetterGeneration = {
  coverLetter: 'Cover letter',
}

const feedbackGeneration = {
  rating: 82,
  rationale: 'Strong backend fit with minor domain gaps.',
  strengths: ['Backend experience'],
  gaps: ['No fintech background'],
  improvements: ['Highlight reliability wins'],
  suggestions: ['Reduced API latency 35% by rewriting hot-path queries and adding targeted indexes.'],
}

describe('generateTailoredResume', () => {
  it('calls only the resume schema', async () => {
    ai.completeJSON.mockResolvedValueOnce({ data: resumeGeneration, usage: { prompt_tokens: 1, completion_tokens: 1 }, model: 'openai/gpt-5-mini' })

    await expect(generateTailoredResume('Résumé facts', job)).resolves.toEqual({
      ...resumeGeneration,
      usage: { promptTokens: 1, completionTokens: 1 },
      model: 'openai/gpt-5-mini',
    })
    const prompt = ai.completeJSON.mock.calls[0][1]
    const schema = ai.completeJSON.mock.calls[0][2]
    expect(prompt).toContain('"tailoredResume"')
    expect(prompt).not.toContain('"coverLetter"')
    expect(prompt).not.toContain('"rating"')
    expect(schema.safeParse(resumeGeneration).success).toBe(true)
    expect(schema.safeParse(resumeGeneration).success).toBe(true)
    expect(schema.safeParse({ tailoredResume: { contact: 'wrong shape' } }).success).toBe(false)
    expect(schema.safeParse({ ...resumeGeneration, coverLetter: 'wrong shape' }).success).toBe(false)
  })
})

describe('generateCoverLetter', () => {
  it('calls only the cover letter schema', async () => {
    ai.completeJSON.mockResolvedValueOnce({ data: coverLetterGeneration, usage: { prompt_tokens: 2, completion_tokens: 3 }, model: 'openai/gpt-5-mini' })

    await expect(generateCoverLetter('Résumé facts', job)).resolves.toEqual({
      ...coverLetterGeneration,
      usage: { promptTokens: 2, completionTokens: 3 },
      model: 'openai/gpt-5-mini',
    })
    const prompt = ai.completeJSON.mock.calls[0][1]
    const schema = ai.completeJSON.mock.calls[0][2]
    expect(prompt).toContain('"coverLetter"')
    expect(prompt).not.toContain('"tailoredResume"')
    expect(prompt).not.toContain('"rating"')
    expect(schema.safeParse(coverLetterGeneration).success).toBe(true)
    expect(schema.safeParse({ ...coverLetterGeneration, tailoredResume: 'wrong shape' }).success).toBe(false)
  })
})

describe('generateFeedback', () => {
  it('calls only the feedback schema', async () => {
    ai.completeJSON.mockResolvedValueOnce({ data: feedbackGeneration, usage: { prompt_tokens: 4, completion_tokens: 5 }, model: 'openai/gpt-5-mini' })

    await expect(generateFeedback('Résumé facts', job)).resolves.toEqual({
      ...feedbackGeneration,
      usage: { promptTokens: 4, completionTokens: 5 },
      model: 'openai/gpt-5-mini',
    })
    const prompt = ai.completeJSON.mock.calls[0][1]
    const schema = ai.completeJSON.mock.calls[0][2]
    expect(prompt).toContain('"rating"')
    expect(prompt).toContain('"rationale"')
    expect(prompt).not.toContain('"coverLetter"')
    expect(prompt).not.toContain('"tailoredResume"')
    expect(schema.safeParse(feedbackGeneration).success).toBe(true)
    expect(schema.safeParse({ ...feedbackGeneration, coverLetter: 'wrong shape' }).success).toBe(false)
  })
})
