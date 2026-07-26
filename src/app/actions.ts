'use server'

import { adzuna } from '@/domains/jobs/providers/adzuna'
import { reed } from '@/domains/jobs/providers/reed'
import { upsertJobs } from '@/domains/jobs/db'
import type { SearchParams } from '@/domains/jobs/types'

export async function searchJobs(params: SearchParams): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const providers = [adzuna, reed]
  const allJobs = await Promise.allSettled(
    providers.map(p => p.search(params))
  )

  const jobs = allJobs.flatMap((result, i) => {
    if (result.status === 'fulfilled') return result.value
    console.error(`${i === 0 ? 'Adzuna' : 'Reed'} search failed: ${result.reason?.message ?? 'unknown'}`)
    return []
  })

  if (jobs.length === 0) {
    const allFailed = allJobs.every(r => r.status === 'rejected')
    if (allFailed) return { ok: false, error: 'No job sources returned results' }
  }

  const count = await upsertJobs(jobs)
  return { ok: true, count }
}
