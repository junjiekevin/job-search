import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dedupeHash, normalizeJob } from './normalize'
import { adzuna } from './providers/adzuna'
import { reed } from './providers/reed'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  vi.clearAllMocks()
})

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
    expect(job.dedupe_hash).toBe(dedupeHash('Acme', 'Engineer', 'London'))
  })
})

describe('adzuna.search', () => {
  beforeEach(() => {
    vi.stubEnv('ADZUNA_APP_ID', 'test-app-id')
    vi.stubEnv('ADZUNA_API_KEY', 'test-api-key')
  })

  it('maps redirect_url to posting_url and apply_url', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: [{
          id: 'abc123',
          title: 'Engineer',
          description: 'A job',
          created: '2025-01-01T00:00:00Z',
          redirect_url: 'https://adzuna.example.com/apply',
          company: { display_name: 'Acme' },
          location: { display_name: 'London' },
          salary_min: null,
          salary_max: null,
          salary_is_predicted: '0',
        }],
      }),
    })

    const jobs = await adzuna.search({ what: 'engineer' })
    expect(jobs).toHaveLength(1)
    expect(jobs[0].posting_url).toBe('https://adzuna.example.com/apply')
    expect(jobs[0].apply_url).toBe('https://adzuna.example.com/apply')
  })

  it('excludes predicted salary', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: [{
          id: 'abc123',
          title: 'Engineer',
          description: 'A job',
          created: '2025-01-01T00:00:00Z',
          redirect_url: 'https://adzuna.example.com/apply',
          company: { display_name: 'Acme' },
          location: { display_name: 'London' },
          salary_min: 50000,
          salary_max: 70000,
          salary_is_predicted: '1',
        }],
      }),
    })

    const jobs = await adzuna.search({ what: 'engineer' })
    expect(jobs[0].salary_min).toBeNull()
    expect(jobs[0].salary_max).toBeNull()
  })

  it('includes non-predicted salary', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: [{
          id: 'abc123',
          title: 'Engineer',
          description: 'A job',
          created: '2025-01-01T00:00:00Z',
          redirect_url: 'https://adzuna.example.com/apply',
          company: { display_name: 'Acme' },
          location: { display_name: 'London' },
          salary_min: 50000,
          salary_max: 70000,
          salary_is_predicted: '0',
        }],
      }),
    })

    const jobs = await adzuna.search({ what: 'engineer' })
    expect(jobs[0].salary_min).toBe(50000)
    expect(jobs[0].salary_max).toBe(70000)
  })

  it('maps employment_type from contract_time', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: [{
          id: 'abc123',
          title: 'Engineer',
          description: 'A job',
          created: '2025-01-01T00:00:00Z',
          redirect_url: 'https://adzuna.example.com/apply',
          company: { display_name: 'Acme' },
          location: { display_name: 'London' },
          salary_min: null,
          salary_max: null,
          salary_is_predicted: '0',
          contract_time: 'full_time',
        }],
      }),
    })

    const jobs = await adzuna.search({ what: 'engineer' })
    expect(jobs[0].employment_type).toBe('full-time')
  })

  it('throws if env vars are missing', async () => {
    vi.stubEnv('ADZUNA_APP_ID', '')
    vi.stubEnv('ADZUNA_API_KEY', '')
    await expect(adzuna.search({ what: 'engineer' })).rejects.toThrow('Adzuna')
  })
})

describe('reed.search', () => {
  beforeEach(() => {
    vi.stubEnv('REED_API_KEY', 'test-reed-key')
  })

  it('builds posting_url from jobId', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: [{
          jobId: 123456,
          employerName: 'Acme',
          jobTitle: 'Engineer',
          description: 'A job',
          locationName: 'London',
          minimumSalary: null,
          maximumSalary: null,
          currency: null,
          contractType: null,
          jobType: null,
        }],
      }),
    })

    const jobs = await reed.search({ what: 'engineer' })
    expect(jobs[0].posting_url).toBe('https://www.reed.co.uk/jobs/123456')
    expect(jobs[0].apply_url).toBe('https://www.reed.co.uk/jobs/123456')
  })

  it('maps employment_type from flag fields', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: [{
          jobId: 1,
          employerName: 'Acme',
          jobTitle: 'Engineer',
          description: 'A job',
          locationName: 'London',
          minimumSalary: null,
          maximumSalary: null,
          currency: null,
          contractType: null,
          jobType: null,
          fullTime: true,
          partTime: false,
          contract: true,
        }],
      }),
    })

    const jobs = await reed.search({ what: 'engineer' })
    expect(jobs[0].employment_type).toContain('contract')
    expect(jobs[0].employment_type).toContain('full-time')
    expect(jobs[0].employment_type).not.toContain('part-time')
    expect(jobs[0].employment_type).not.toContain('permanent')
  })

  it('throws if REED_API_KEY is missing', async () => {
    vi.stubEnv('REED_API_KEY', '')
    await expect(reed.search({ what: 'engineer' })).rejects.toThrow('Reed')
  })
})
