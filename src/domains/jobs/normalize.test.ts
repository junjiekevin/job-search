import { describe, it, expect } from 'vitest'
import { dedupeHash, normalizeJob } from './normalize'

describe('dedupeHash', () => {
  it('produces the same hash for identical inputs', () => {
    const a = dedupeHash('Google', 'Software Engineer', 'London')
    const b = dedupeHash('Google', 'Software Engineer', 'London')
    expect(a).toBe(b)
  })

  it('is case-insensitive', () => {
    const a = dedupeHash('Google', 'Software Engineer', 'London')
    const b = dedupeHash('google', 'software engineer', 'london')
    expect(a).toBe(b)
  })

  it('trims whitespace', () => {
    const a = dedupeHash('  Google  ', ' Software Engineer ', ' London ')
    const b = dedupeHash('Google', 'Software Engineer', 'London')
    expect(a).toBe(b)
  })

  it('handles null location', () => {
    const a = dedupeHash('Google', 'Engineer', null)
    const b = dedupeHash('Google', 'Engineer', '')
    expect(a).toBe(b)
  })

  it('produces different hashes for different companies', () => {
    const a = dedupeHash('Google', 'Engineer', 'London')
    const b = dedupeHash('Meta', 'Engineer', 'London')
    expect(a).not.toBe(b)
  })
})

describe('normalizeJob', () => {
  it('adds dedupe_hash', () => {
    const job = normalizeJob({
      source: 'adzuna',
      external_id: '123',
      title: 'Engineer',
      company: 'Acme',
      location: 'London',
      description: 'A job',
      posting_url: 'https://example.com',
      apply_url: 'https://example.com/apply',
      salary_min: 50000,
      salary_max: 70000,
      salary_currency: 'GBP',
      employment_type: 'full-time',
      posted_at: '2025-01-01T00:00:00Z',
    })
    expect(job.dedupe_hash).toBeTruthy()
    expect(job.dedupe_hash).toBe(dedupeHash('Acme', 'Engineer', 'London'))
  })

  it('excludes predicted salary', () => {
    const job = normalizeJob({
      source: 'adzuna',
      external_id: '456',
      title: 'Developer',
      company: 'Beta',
      location: null,
      description: null,
      posting_url: null,
      apply_url: null,
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      employment_type: null,
      posted_at: null,
    })
    expect(job.dedupe_hash).toBeTruthy()
    expect(job.salary_min).toBeNull()
    expect(job.salary_max).toBeNull()
  })
})
