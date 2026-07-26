import { describe, expect, it, vi } from 'vitest'
import { upsertJobs } from './db'
import type { NormalizedJob } from './types'

const db = vi.hoisted(() => ({
  upsert: vi.fn(),
  getUser: vi.fn(),
}))

vi.mock('@/lib/db/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: db.getUser,
    },
    from: vi.fn(() => ({
      upsert: db.upsert,
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
})
