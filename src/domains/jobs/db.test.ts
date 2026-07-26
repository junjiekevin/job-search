import { beforeEach, describe, expect, it, vi } from 'vitest'
import { upsertJobs, listJobs } from './db'
import type { NormalizedJob } from './types'

const db = vi.hoisted(() => ({
  upsert: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  getUser: vi.fn(),
}))

vi.mock('@/lib/db/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: db.getUser,
    },
    from: vi.fn(() => ({
      upsert: db.upsert,
      select: db.select,
    })),
  })),
}))

function job(overrides: Partial<NormalizedJob>): NormalizedJob {
  return {
    source: 'adzuna',
    external_id: '1',
    title: 'Engineer',
    company: 'Acme',
    location: 'Remote',
    description: 'Build things',
    posting_url: 'https://example.com/job',
    apply_url: 'https://example.com/apply',
    salary_min: null,
    salary_max: null,
    salary_currency: null,
    employment_type: null,
    posted_at: null,
    dedupe_hash: 'same-posting',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('upsertJobs', () => {
  it('collapses provider duplicates before one upsert', async () => {
    db.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    db.upsert.mockResolvedValueOnce({ error: null })

    await expect(upsertJobs([
      job({ source: 'adzuna', external_id: 'adzuna-1' }),
      job({ source: 'reed', external_id: 'reed-1' }),
    ])).resolves.toBe(1)

    const rows = db.upsert.mock.calls[0][0]
    expect(rows).toHaveLength(1)
    expect(db.upsert.mock.calls[0][1]).toMatchObject({ onConflict: 'user_id, dedupe_hash' })
  })

  it('stamps search_key on upserted rows', async () => {
    db.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    db.upsert.mockResolvedValueOnce({ error: null })

    await upsertJobs([job({ dedupe_hash: 'key-1' })], 'search-key-abc')

    const rows = db.upsert.mock.calls[0][0]
    expect(rows[0].search_key).toBe('search-key-abc')
  })
})

describe('listJobs', () => {
  it('filters by searchKey when provided', async () => {
    db.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    db.select.mockReturnValueOnce({ eq: db.eq })
    db.eq.mockReturnValueOnce({ eq: db.eq })
    db.eq.mockReturnValueOnce({ order: db.order })
    db.order.mockResolvedValueOnce({ data: [], error: null })

    await listJobs({ searchKey: 'key-2' })

    expect(db.eq).toHaveBeenCalledWith('search_key', 'key-2')
  })

  it('returns only rows stamped with the requested search key', async () => {
    const key2Rows = [{ id: '2', title: 'Engineer', company: 'Acme', search_key: 'key-2', posted_at: null, source: 'reed', location: null, description: null, posting_url: null, apply_url: null, salary_min: null, salary_max: null, salary_currency: null, employment_type: null, fetched_at: '2024-01-01', dedupe_hash: 'same-posting', created_at: '2024-01-01', user_id: 'user-1' }]

    db.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    db.select.mockReturnValueOnce({ eq: db.eq })
    db.eq.mockReturnValueOnce({ eq: db.eq })
    db.eq.mockReturnValueOnce({ order: db.order })
    db.order.mockResolvedValueOnce({ data: key2Rows, error: null })

    const result = await listJobs({ searchKey: 'key-2' })

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Engineer')
    expect(result[0].company).toBe('Acme')
    expect(db.eq).toHaveBeenCalledWith('search_key', 'key-2')
  })
})
