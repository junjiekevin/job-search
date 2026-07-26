import { describe, expect, it, vi } from 'vitest'
import { generateTailoring } from './generate'
import type { Job } from '@/domains/jobs/types'

const ai = vi.hoisted(() => ({ completeJSON: vi.fn() }))

vi.mock('@/lib/ai/client', () => ai)

const job: Job = {
  id: 'job-1', source: 'manual', title: 'Engineer', company: 'Acme', location: 'New York', description: 'Build reliable systems.', postingUrl: null, applyUrl: null, salaryMin: null, salaryMax: null, salaryCurrency: null, employmentType: 'full-time', postedAt: null,
}

const generation = {
  analysis: {
    primaryResponsibilities: ['Build systems'], requiredSkills: ['TypeScript'], preferredSkills: [], technologies: ['React'], experienceExpectations: ['Three years'], resumeImprovements: ['Lead with systems work'], missingQualifications: [], strongAlignment: ['Backend experience'],
  },
  tailoredResume: 'Tailored résumé',
  coverLetter: 'Cover letter',
}

describe('generateTailoring', () => {
  it('uses one JSON call with the complete analysis schema', async () => {
    ai.completeJSON.mockResolvedValueOnce({ data: generation, usage: { prompt_tokens: 1, completion_tokens: 1 }, model: 'openai/gpt-5-mini' })

    await expect(generateTailoring('Résumé facts', job)).resolves.toEqual({
      ...generation,
      usage: { promptTokens: 1, completionTokens: 1 },
      model: 'openai/gpt-5-mini',
    })
    expect(ai.completeJSON).toHaveBeenCalledTimes(1)
    const prompt = ai.completeJSON.mock.calls[0][1]
    expect(prompt).toContain('"analysis"')
    expect(prompt).toContain('"primaryResponsibilities"')
    expect(prompt).toContain('"strongAlignment"')
    expect(prompt).not.toContain('"fitScore"')
    const schema = ai.completeJSON.mock.calls[0][2]
    expect(schema.safeParse(generation).success).toBe(true)
    expect(schema.safeParse({ ...generation, analysis: {} }).success).toBe(false)
  })
})
